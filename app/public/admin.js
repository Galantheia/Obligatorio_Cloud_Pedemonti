const loadingScreen = document.getElementById('admin-loading');
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');
const loginSpinner = document.getElementById('login-spinner');
const loginButtonLabel = document.getElementById('login-button-label');
const loginStatus = document.getElementById('login-status');
const logoutButton = document.getElementById('logout-button');
const toastRegion = document.getElementById('toast-region');

const overviewViewButton = document.getElementById('overview-view-button');
const productsViewButton = document.getElementById('products-view-button');
const openCreateModalButton = document.getElementById('open-create-modal-button');
const catalogCreateButton = document.getElementById('catalog-create-button');
const overviewSection = document.getElementById('overview-section');
const productsSection = document.getElementById('products-section');
const adminProductsSearch = document.getElementById('admin-products-search');
const catalogStatus = document.getElementById('catalog-status');
const productsAdminList = document.getElementById('products-admin-list');

const productModal = document.getElementById('product-modal');
const productModalBackdrop = document.getElementById('product-modal-backdrop');
const closeProductModalButton = document.getElementById('close-product-modal-button');
const productModalTitle = document.getElementById('product-modal-title');
const productForm = document.getElementById('product-form');
const productGroupInput = document.getElementById('product-group-input');
const productNameInput = document.getElementById('product-name-input');
const productPriceInput = document.getElementById('product-price-input');
const productImageInput = document.getElementById('product-image-input');
const productOrderInput = document.getElementById('product-order-input');
const productDescriptionInput = document.getElementById('product-description-input');
const productActiveInput = document.getElementById('product-active-input');
const productSubmitButton = document.getElementById('product-submit-button');
const productSubmitSpinner = document.getElementById('product-submit-spinner');
const productSubmitLabel = document.getElementById('product-submit-label');
const productCancelButton = document.getElementById('product-cancel-button');
const productFormStatus = document.getElementById('product-form-status');

const welcomeTitle = document.getElementById('welcome-title');
const welcomeCopy = document.getElementById('welcome-copy');
const totalProducts = document.getElementById('total-products');
const activeProducts = document.getElementById('active-products');
const totalUsers = document.getElementById('total-users');
const activeAdmins = document.getElementById('active-admins');
const groupStats = document.getElementById('group-stats');
const serverStats = document.getElementById('server-stats');

let adminProducts = [];
let editingProductId = null;
let currentAdminView = 'overview';
let catalogSearchDebounceTimer;

function showToast(message, variant = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast--${variant}`;
  toast.textContent = message;
  toastRegion.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 3600);
}

function showError(message) {
  showToast(message, 'error');
}

function showSuccess(message) {
  showToast(message, 'success');
}

function setLoadingState(isLoading) {
  loadingScreen.classList.toggle('hidden', !isLoading);
}

function setLoggedOutState() {
  setLoadingState(false);
  loginView.classList.remove('hidden');
  dashboardView.classList.add('hidden');
  logoutButton.classList.add('hidden');
}

function setLoggedInState() {
  setLoadingState(false);
  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  logoutButton.classList.remove('hidden');
}

function setAdminView(view) {
  currentAdminView = view;
  const showingOverview = view === 'overview';

  overviewSection.classList.toggle('hidden', !showingOverview);
  productsSection.classList.toggle('hidden', showingOverview);
  overviewViewButton.classList.toggle('is-active', showingOverview);
  productsViewButton.classList.toggle('is-active', !showingOverview);
}

function openProductModal() {
  productModal.classList.remove('hidden');
  productModal.setAttribute('aria-hidden', 'false');
}

function closeProductModal() {
  productModal.classList.add('hidden');
  productModal.setAttribute('aria-hidden', 'true');
}

function setLoginBusy(isBusy) {
  loginButton.disabled = isBusy;
  loginSpinner.classList.toggle('hidden', !isBusy);
  loginButtonLabel.textContent = isBusy ? 'Ingresando...' : 'Ingresar';
}

function setProductBusy(isBusy) {
  productSubmitButton.disabled = isBusy;
  productSubmitSpinner.classList.toggle('hidden', !isBusy);
  productSubmitLabel.textContent = isBusy
    ? (editingProductId ? 'Actualizando...' : 'Guardando...')
    : (editingProductId ? 'Actualizar producto' : 'Guardar producto');
  productCancelButton.disabled = isBusy;
}

function resetProductForm() {
  editingProductId = null;
  productForm.reset();
  productActiveInput.checked = true;
  productOrderInput.value = '0';
  productFormStatus.textContent = 'Completá los campos para publicar un producto nuevo.';
  productSubmitLabel.textContent = 'Guardar producto';
  productCancelButton.classList.add('hidden');
  productModalTitle.textContent = 'Nuevo producto';
}

function renderList(container, items) {
  if (!items.length) {
    container.innerHTML = '<div class="list-row"><span>Sin datos</span><strong>0</strong></div>';
    return;
  }

  container.innerHTML = items
    .map((item) => `<div class="list-row"><span>${item.label}</span><strong>${item.value}</strong></div>`)
    .join('');
}

function renderProductsAdminList(products) {
  if (!products.length) {
    productsAdminList.innerHTML = `
      <div class="empty-admin-state">
        No se encontraron productos para esta búsqueda.
      </div>
    `;
    return;
  }

  productsAdminList.innerHTML = products
    .map(
      (product) => `
        <article class="admin-product-card" data-product-id="${product.id}">
          <div class="admin-product-main">
            <div class="admin-product-topline">
              <span class="admin-product-group">${product.product_group}</span>
              <span class="admin-product-price">USD ${Number(product.price).toFixed(2)}</span>
            </div>
            <h4>${product.name}</h4>
            <p>${product.description}</p>
            <div class="admin-product-meta">
              <span>ID: ${product.id}</span>
              <span>Orden: ${product.display_order}</span>
              <span>${product.active ? 'Activo' : 'Inactivo'}</span>
            </div>
          </div>

          <div class="admin-product-actions">
            <button class="ghost-button admin-edit-button" type="button" data-action="edit" data-product-id="${product.id}">
              Editar
            </button>
            <button class="admin-delete-button" type="button" data-action="delete" data-product-id="${product.id}">
              Eliminar
            </button>
          </div>
        </article>
      `
    )
    .join('');
}

function setEditingProduct(product) {
  editingProductId = product.id;
  productGroupInput.value = product.product_group;
  productNameInput.value = product.name;
  productPriceInput.value = product.price;
  productImageInput.value = product.image_url || '';
  productOrderInput.value = product.display_order;
  productDescriptionInput.value = product.description || '';
  productActiveInput.checked = Boolean(product.active);
  productSubmitLabel.textContent = 'Actualizar producto';
  productCancelButton.classList.remove('hidden');
  productModalTitle.textContent = `Editar producto #${product.id}`;
  productFormStatus.textContent = `Editando producto #${product.id}.`;
  openProductModal();
}

function fillDashboard(data) {
  welcomeTitle.textContent = `Hola, ${data.user.fullName || data.user.username}`;
  welcomeCopy.textContent = ``;

  totalProducts.textContent = data.stats.products.total_products;
  activeProducts.textContent = data.stats.products.active_products;
  totalUsers.textContent = data.stats.users.total_users;
  activeAdmins.textContent = data.stats.users.active_admins;

  renderList(
    groupStats,
    data.stats.groups.map((group) => ({
      label: group.product_group,
      value: group.total
    }))
  );

  renderList(serverStats, [
    { label: 'Servidor', value: data.server.serverId || 'local' },
    { label: 'Hostname', value: data.server.hostname || 'local' },
    { label: 'Zona', value: data.server.availabilityZone || 'local' },
    { label: 'Tipo', value: data.server.instanceType || 'local' }
  ]);
}

async function loadProductsAdminList(search = '') {
  catalogStatus.textContent = search ? `Buscando "${search}"...` : 'Cargando catálogo completo...';

  const params = new URLSearchParams();

  if (search.trim()) {
    params.set('search', search.trim());
  }

  const response = await fetch(params.toString() ? `/api/admin/products?${params.toString()}` : '/api/admin/products');

  if (response.status === 401) {
    setLoggedOutState();
    return;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'No se pudo cargar la lista de productos.');
  }

  const data = await response.json();
  adminProducts = data.products || [];
  renderProductsAdminList(adminProducts);
  catalogStatus.textContent = data.search
    ? `${adminProducts.length} resultado(s) para "${data.search}".`
    : `${adminProducts.length} producto(s) cargado(s)`;
}

async function loadOverview() {
  const response = await fetch('/api/admin/overview');

  if (response.status === 401) {
    setLoggedOutState();
    return false;
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || 'No se pudo cargar el panel.');
  }

  const data = await response.json();
  fillDashboard(data);
  await loadProductsAdminList(adminProductsSearch.value);
  setLoggedInState();
  return true;
}

async function checkSession() {
  const response = await fetch('/api/admin/session');

  if (response.status === 401) {
    setLoggedOutState();
    return;
  }

  if (!response.ok) {
    throw new Error('No se pudo validar la sesión admin.');
  }

  await loadOverview();
}

async function handleLogin(event) {
  event.preventDefault();

  setLoginBusy(true);
  loginStatus.textContent = 'Validando credenciales...';

  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: usernameInput.value,
        password: passwordInput.value
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || 'No se pudo iniciar sesión.');
    }

    loginStatus.textContent = 'Sesión iniciada.';
    passwordInput.value = '';
    await loadOverview();
  } catch (error) {
    loginStatus.textContent = 'Acceso rechazado.';
    showError(error.message);
  } finally {
    setLoginBusy(false);
  }
}

async function handleLogout() {
  const response = await fetch('/api/admin/logout', {
    method: 'POST'
  });

  if (!response.ok) {
    showError('No se pudo cerrar la sesión.');
    return;
  }

  loginStatus.textContent = 'Sesión finalizada.';
  setLoggedOutState();
  closeProductModal();
  showSuccess('Sesión cerrada correctamente.');
}

async function handleProductSubmit(event) {
  event.preventDefault();

  setProductBusy(true);
  productFormStatus.textContent = editingProductId
    ? 'Actualizando producto...'
    : 'Creando producto...';

  try {
    const response = await fetch(editingProductId ? `/api/admin/products/${editingProductId}` : '/api/admin/products', {
      method: editingProductId ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        productGroup: productGroupInput.value,
        name: productNameInput.value,
        price: productPriceInput.value,
        imageUrl: productImageInput.value,
        displayOrder: productOrderInput.value,
        description: productDescriptionInput.value,
        active: productActiveInput.checked
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.error || 'No se pudo guardar el producto.');
    }

    const data = await response.json();
    await loadOverview();
    closeProductModal();
    showSuccess(
      editingProductId
        ? `Producto "${data.product.name}" actualizado correctamente.`
        : `Producto "${data.product.name}" creado correctamente.`
    );
    resetProductForm();
    setAdminView('products');
  } catch (error) {
    productFormStatus.textContent = 'No se pudo guardar el producto.';
    showError(error.message);
  } finally {
    setProductBusy(false);
  }
}

function handleAdminSearchInput() {
  clearTimeout(catalogSearchDebounceTimer);

  const search = adminProductsSearch.value.trim();

  catalogSearchDebounceTimer = window.setTimeout(async () => {
    try {
      await loadProductsAdminList(search);
    } catch (error) {
      showError(error.message);
    }
  }, 250);
}

async function handleProductsAdminClick(event) {
  const button = event.target.closest('button[data-action]');

  if (!button) {
    return;
  }

  const productId = Number(button.dataset.productId);
  const product = adminProducts.find((item) => item.id === productId);

  if (!product) {
    showError('No se encontró el producto seleccionado.');
    return;
  }

  if (button.dataset.action === 'edit') {
    setEditingProduct(product);
    return;
  }

  if (button.dataset.action === 'delete') {
    const confirmed = window.confirm(`¿Eliminar "${product.name}"? Esta acción no se puede deshacer.`);

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || 'No se pudo eliminar el producto.');
      }

      await loadOverview();
      if (editingProductId === product.id) {
        resetProductForm();
        closeProductModal();
      }
      showSuccess(`Producto "${product.name}" eliminado correctamente.`);
    } catch (error) {
      showError(error.message);
    }
  }
}

function openCreateModal() {
  resetProductForm();
  openProductModal();
}

overviewViewButton.addEventListener('click', () => setAdminView('overview'));
productsViewButton.addEventListener('click', () => setAdminView('products'));
openCreateModalButton.addEventListener('click', openCreateModal);
catalogCreateButton.addEventListener('click', openCreateModal);
closeProductModalButton.addEventListener('click', () => {
  resetProductForm();
  closeProductModal();
});
productModalBackdrop.addEventListener('click', () => {
  resetProductForm();
  closeProductModal();
});

loginForm.addEventListener('submit', handleLogin);
logoutButton.addEventListener('click', handleLogout);
productForm.addEventListener('submit', handleProductSubmit);
productCancelButton.addEventListener('click', resetProductForm);
adminProductsSearch.addEventListener('input', handleAdminSearchInput);
productsAdminList.addEventListener('click', handleProductsAdminClick);

checkSession().catch((error) => {
  setLoadingState(false);
  setLoggedOutState();
  showError(error.message);
});
