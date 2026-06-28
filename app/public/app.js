const serverBanner = document.getElementById('server-banner');
const productsContainer = document.getElementById('products');
const productGroupTitle = document.getElementById('product-group');
const resetGroupButton = document.getElementById('reset-group-btn');
const errorBox = document.getElementById('error-box');

function showError(message) {
  errorBox.classList.remove('hidden');
  errorBox.textContent = message;
}

function clearError() {
  errorBox.classList.add('hidden');
  errorBox.textContent = '';
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

function renderProducts(products) {
  if (!products.length) {
    productsContainer.innerHTML = `
      <div class="empty-state">
        No hay productos activos para este grupo.
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

async function loadProducts() {
  const response = await fetch('/api/products');

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'No se pudieron cargar los productos.');
  }

  const data = await response.json();

  productGroupTitle.textContent = formatGroupName(data.productGroup);
  renderProducts(data.products || []);
}

async function resetProductGroup() {
  resetGroupButton.disabled = true;
  resetGroupButton.textContent = 'Cambiando...';

  try {
    await fetch('/api/product-group/reset', { method: 'POST' });
    await loadProducts();
  } catch (error) {
    showError(error.message);
  } finally {
    resetGroupButton.disabled = false;
    resetGroupButton.textContent = 'Cambiar grupo de productos';
  }
}

async function init() {
  clearError();

  try {
    await Promise.all([loadServerInfo(), loadProducts()]);
  } catch (error) {
    showError(error.message);
  }
}

resetGroupButton.addEventListener('click', resetProductGroup);

init();
