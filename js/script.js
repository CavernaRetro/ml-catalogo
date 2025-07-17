let productos = [];
let productosGuardados = [];

function cargarProductosDesdeSheet(mostrarDirecto = true) {
  const catalog = document.getElementById("catalog");
  const loader = document.getElementById("catalogLoader");

  if (mostrarDirecto) {
    loader.style.display = "block";
    catalog.style.display = "none";
  }

  fetch("https://script.google.com/macros/s/AKfycbyn6ohcozftWPxtWBt_9eWSVtTYlQXAoDcHLlfAUflG_T-1R2NtSrSDP7pH9RGPYGeftw/exec")
    .then(res => res.json())
    .then(data => {
      if (mostrarDirecto) {
        productos = data;
        productosGuardados = JSON.stringify(data);
        updateCatalog();
      } else {
        const nuevoContenido = JSON.stringify(data);
        if (nuevoContenido !== productosGuardados) {
          document.getElementById('updateNotice').classList.remove('hidden');
        }
      }
    })
    .catch(err => {
      console.error("Error al cargar productos:", err);
    })
    .finally(() => {
      if (mostrarDirecto) {
        loader.style.display = "none";
        catalog.style.display = "grid";
      }
    });
}


// Primera carga
cargarProductosDesdeSheet(true);

// Verifica cambios cada 2 minutos
setInterval(() => {
  cargarProductosDesdeSheet(false);
}, 2 * 60 * 1000);

// Acción al hacer clic en el aviso
function actualizarCatalogoDesdeAviso() {
  document.getElementById('updateNotice').classList.add('hidden');
  cargarProductosDesdeSheet(true);
}


const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let mostrandoFavoritos = false;

const catalog = document.getElementById('catalog');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const categorySelect = document.getElementById('categorySelect');
const pagination = document.getElementById('pagination');

// Favoritos
function toggleFavorito(producto) {
  let favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
  const index = favoritos.findIndex(f => f.nombre === producto.nombre);

  if (index >= 0) {
    favoritos.splice(index, 1);
  } else {
    favoritos.push(producto);
  }

  localStorage.setItem("favoritos", JSON.stringify(favoritos));
  updateCatalog();
}

function esFavorito(nombre) {
  const favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];
  return favoritos.some(p => p.nombre === nombre);
}

//Buscar palabras sin acento
function normalizarTexto(texto) {
  return texto
    .normalize("NFD") // descompone acentos
    .replace(/[\u0300-\u036f]/g, "") // remueve los acentos
    .toLowerCase(); // pasa todo a minúsculas
}

// Renderizado
function filterAndSort() {
  let baseData = mostrandoFavoritos
    ? JSON.parse(localStorage.getItem("favoritos")) || []
    : productos;

  const textoBusqueda = normalizarTexto(searchInput.value);

  let filtered = baseData.filter(p => {
    const nombreNormalizado = normalizarTexto(p.nombre);
    const matchSearch = nombreNormalizado.includes(textoBusqueda);
    const matchCategory = categorySelect.value === 'all' || p.categoria === categorySelect.value;
    return matchSearch && matchCategory;
  });

  if (sortSelect.value === 'low') {
    filtered.sort((a, b) => a.precio - b.precio);
  } else if (sortSelect.value === 'high') {
    filtered.sort((a, b) => b.precio - a.precio);
  } else if (sortSelect.value === 'newest') {
    filtered.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }

  return filtered;
}

function renderCatalogPage(data, page) {
  catalog.innerHTML = '';
  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = data.slice(start, end);

  if (pageItems.length === 0) {
    catalog.innerHTML = "<p style='grid-column: span 5; text-align: center;'>No hay artículos para mostrar.</p>";
    pagination.innerHTML = '';
    return;
  }

  pageItems.forEach(p => {
    const item = document.createElement('div');
    item.className = 'item';
    const hoy = new Date();
    const fechaProducto = new Date(p.fecha);
    const diferenciaDias = Math.floor((hoy - fechaProducto) / (1000 * 60 * 60 * 24));
    const esNuevo = diferenciaDias <= 3;

    item.innerHTML = `
      ${esNuevo ? '<span class="badge-new">Recién Agregado</span>' : ''}
      <img src="${p.imagen}" alt="${p.nombre}">
      <h4>${p.nombre}</h4>
      <p>$${p.precio}</p>
      <a href="${p.enlace}" target="_blank">Ver en Mercado Libre</a><br>
      <button onclick='toggleFavorito(${JSON.stringify(p)})'>
        ${esFavorito(p.nombre) ? "⭐ Favorito" : "☆ Agregar a Favoritos"}
      </button>
    `;
    catalog.appendChild(item);
  });
}

function renderPagination(totalItems) {
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  pagination.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = i === currentPage ? 'active' : '';
    btn.addEventListener('click', () => {
      currentPage = i;
      updateCatalog();
      scrollToTop(); // ✅ NUEVO: hace scroll al inicio en móvil/PC
    });
    pagination.appendChild(btn);
  }

  if (mostrandoFavoritos && totalItems > 0) {
    const label = document.createElement('p');
    label.style.textAlign = 'center';
    label.textContent = "Mostrando favoritos ⭐";
    pagination.prepend(label);
  }
}

function updateCatalog() {
  const filtered = filterAndSort();
  renderCatalogPage(filtered, currentPage);
  renderPagination(filtered.length);
}

searchInput.addEventListener('input', () => {
  currentPage = 1;
  updateCatalog();
});

// Inicio Agregar X al buscador de articulos
const clearSearchBtn = document.getElementById("clearSearch");

searchInput.addEventListener("input", () => {
  currentPage = 1;
  updateCatalog();

  if (searchInput.value.trim() !== "") {
    clearSearchBtn.classList.add("visible");
  } else {
    clearSearchBtn.classList.remove("visible");
  }
});

clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  clearSearchBtn.classList.remove("visible");
  currentPage = 1;
  updateCatalog();
});
// Final Agregar X al buscador de articulos

sortSelect.addEventListener('change', () => {
  currentPage = 1;
  updateCatalog();
});
categorySelect.addEventListener('change', () => {
  currentPage = 1;
  updateCatalog();
});

// Ver favoritos
document.getElementById('verFavoritosBtn').addEventListener('click', (e) => {
  e.preventDefault();
  mostrandoFavoritos = true;
  currentPage = 1;
  updateCatalog();
});

// Ver todo
document.getElementById('verTodoBtn').addEventListener('click', (e) => {
  e.preventDefault();
  mostrandoFavoritos = false;
  currentPage = 1;
  updateCatalog();
});

// Banner rotativo
//const bannerImages = document.querySelectorAll('.banner img');
//let currentBanner = 0;
//setInterval(() => {
//  bannerImages[currentBanner].classList.remove('active');
//  currentBanner = (currentBanner + 1) % bannerImages.length;
//  bannerImages[currentBanner].classList.add('active');
//}, 3000);

// Sticky Header
window.addEventListener('scroll', () => {
  const header = document.getElementById('header');
  if (window.scrollY > 50) {
    header.classList.add('solid');
  } else {
    header.classList.remove('solid');
  }
});

// 🌙 Modo oscuro
const darkToggle = document.getElementById('darkModeToggle');
const body = document.body;

function setDarkMode(isDark) {
  if (isDark) {
    body.classList.add('dark');
    localStorage.setItem("modoOscuro", "true");
    darkToggle.checked = true;
  } else {
    body.classList.remove('dark');
    localStorage.setItem("modoOscuro", "false");
    darkToggle.checked = false;
  }
}

darkToggle.addEventListener('change', () => {
  setDarkMode(darkToggle.checked);
});

window.addEventListener('DOMContentLoaded', () => {
  const modoOscuroGuardado = localStorage.getItem("modoOscuro") === "true";
  setDarkMode(modoOscuroGuardado);
  updateCatalog();
});


// ✅ NUEVO: Scroll al principio compatible con móviles y navegadores modernos
function scrollToTop() {
  const scrollEl = document.scrollingElement || document.documentElement || document.body;
  scrollEl.scrollTo({ top: 0, behavior: 'smooth' });
}

//Imagen a Pantalla Completa
