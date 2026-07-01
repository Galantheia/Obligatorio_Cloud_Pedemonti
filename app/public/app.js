const serverBanner = document.getElementById('server-banner');
const productsContainer = document.getElementById('products');
const productGroupTitle = document.getElementById('product-group');
const resetGroupButton = document.getElementById('reset-group-btn');
const searchInput = document.getElementById('search-input');
const searchSpinner = document.getElementById('search-spinner');
const searchStatus = document.getElementById('search-status');
const resultsSummary = document.getElementById('results-summary');
const errorBox = document.getElementById('error-box');

let searchDebounceTimer;
let currentProductsRequestController;

function showError(message) {
  errorBox.classList.remove('hidden');
  errorBox.textContent = message;
}

function clearError() {
  errorBox.classList.add('hidden');
  errorBox.textContent = '';
}

function setSearchBusy(isBusy, message = '') {
  searchSpinner.classList.toggle('hidden', !isBusy);
  searchStatus.textContent = message || (isBusy ? 'Buscando...' : 'Sincronizado');
}

function setProductsLoading() {
  productsContainer.innerHTML = `
    <div class="empty-state loading-state">
      <span class="inline-spinner" aria-hidden="true"></span>
      <span>Cargando resultados...</span>
    </div>
  `;
}

function formatPrice(value) {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return value;
  }

  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'USD'
  }).format(number);
}

function formatGroupName(group) {
  const names = {
    gadgets: 'Gadgets diarios',
    home_office: 'Home office',
    smart_home: 'Smart home'
  };

  return names[group] || group;
}

function updateResultsSummary({ search = '', count = 0, productGroup = '' }) {
  if (search) {
    resultsSummary.textContent =
      count > 0
        ? `${count} resultado${count === 1 ? '' : 's'} para "${search}".`
        : `No hubo coincidencias para "${search}".`;
    return;
  }

  resultsSummary.textContent = `Mostrando productos del grupo ${formatGroupName(productGroup).toLowerCase()}.`;
}

async function loadServerInfo() {
  const response = await fetch('/api/server-info');

  if (!response.ok) {
    throw new Error('No se pudo obtener la información de la instancia.');
  }

  const info = await response.json();

  serverBanner.classList.remove('skeleton');
  serverBanner.innerHTML = `
    <div class="instance-row">
      <span
        class="instance-color-dot"
        style="background-color: ${info.color};"
        aria-label="Color generado para la instancia"
      ></span>

      <div class="instance-main">
        <strong>${info.serverId}</strong>
        <small>Instancia que respondió esta request</small>
      </div>
    </div>

    <div class="instance-meta">
      <span>Hostname: <code>${info.hostname || 'local'}</code></span>
      <span>Zona: <code>${info.availabilityZone || 'local'}</code></span>
    </div>
  `;
}

function renderProducts(products, search = '') {
  if (!products.length) {
    productsContainer.innerHTML = `
      <div class="empty-state">
        ${search ? 'No hubo resultados para esta búsqueda.' : 'No hay productos activos para este grupo.'}
      </div>
    `;
    return;
  }

  productsContainer.innerHTML = products
    .map(
      (product) => `
        <article class="product-card">
          <img src="${product.image_url}" alt="${product.name}" loading="lazy" />
          <div class="product-content">
            <p class="product-tag">${formatGroupName(product.product_group)}</p>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <strong>${formatPrice(product.price)}</strong>
          </div>
        </article>
      `
    )
    .join('');
}

async function loadProducts(search = '') {
  if (currentProductsRequestController) {
    currentProductsRequestController.abort();
  }

  currentProductsRequestController = new AbortController();
  setProductsLoading();
  setSearchBusy(Boolean(search.trim()));

  const params = new URLSearchParams();

  if (search.trim()) {
    params.set('search', search.trim());
  }

  const queryString = params.toString();
  const response = await fetch(
    queryString ? `/api/products?${queryString}` : '/api/products',
    { signal: currentProductsRequestController.signal }
  );

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'No se pudieron cargar los productos.');
  }

  const data = await response.json();

  productGroupTitle.textContent = data.search ? 'Resultados globales' : formatGroupName(data.productGroup);
  updateResultsSummary({
    search: data.search || search,
    count: (data.products || []).length,
    productGroup: data.productGroup
  });
  renderProducts(data.products || [], data.search || search);
  setSearchBusy(false, data.search ? `Consulta completada para "${data.search}".` : 'Sincronizado');
}

async function resetProductGroup() {
  resetGroupButton.disabled = true;
  resetGroupButton.textContent = 'Cambiando...';

  try {
    await fetch('/api/product-group/reset', { method: 'POST' });
    await loadProducts(searchInput.value);
  } catch (error) {
    showError(error.message);
  } finally {
    resetGroupButton.disabled = false;
    resetGroupButton.textContent = 'Cambiar grupo de productos';
  }
}

function handleSearchInput() {
  clearTimeout(searchDebounceTimer);

  const term = searchInput.value.trim();
  setSearchBusy(Boolean(term), term ? `Preparando búsqueda para "${term}"...` : 'Sincronizado');

  searchDebounceTimer = setTimeout(async () => {
    clearError();

    try {
      await loadProducts(term);
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }

      setSearchBusy(false, 'No se pudo consultar la base de datos.');
      showError(error.message);
    }
  }, 250);
}

async function init() {
  clearError();

  try {
    await Promise.all([loadServerInfo(), loadProducts()]);
  } catch (error) {
    if (error.name === 'AbortError') {
      return;
    }

    setSearchBusy(false, 'No se pudo inicializar la vista.');
    showError(error.message);
  }
}

resetGroupButton.addEventListener('click', resetProductGroup);
searchInput.addEventListener('input', handleSearchInput);

init();
