/****************************************************
 * main.js — Script unificado para index y productos
 ****************************************************/

/* ====== CONFIG GENERAL ====== */
const SHEET_URL = "https://script.google.com/macros/s/AKfycbyn6ohcozftWPxtWBt_9eWSVtTYlQXAoDcHLlfAUflG_T-1R2NtSrSDP7pH9RGPYGeftw/exec";
const CACHE_KEY = "productos_cache";
const CACHE_TIME_KEY = "productos_cache_time";
const CACHE_DURATION = 60 * 60 * 1000; // 1 hora

/* ====== FUNCIONES COMUNES ====== */
function imgPath(name) {
  if (!name) return "";
  return name.includes("/") ? name : `img/articulos/${name}`;
}

function getFavoritos() {
  return JSON.parse(localStorage.getItem("favoritos") || "[]");
}

function esFavorito(id) {
  return getFavoritos().some(f => (f.id || f.ID) === id);
}

function toggleFavorito(producto) {
  let favoritos = getFavoritos();
  const pid = (producto.id || producto.ID);
  const index = favoritos.findIndex(f => (f.id || f.ID) === pid);

  if (index >= 0) {
    favoritos.splice(index, 1);
  } else {
    const copia = { ...producto };
    if (copia.imagen) copia.imagen = copia.imagen.replace(/^.*[\\/]/, '');
    favoritos.push(copia);
  }

  localStorage.setItem("favoritos", JSON.stringify(favoritos));
  renderBotonFavorito(producto);
}

//Nuevo
function renderBotonFavorito(producto) {
  let favBtn = document.getElementById("btnFavoritoProducto");
  if (!favBtn) {
    favBtn = document.createElement("button");
    favBtn.id = "btnFavoritoProducto";

    // 👇 Esto hace que se vea como link/texto plano
    favBtn.style.background = "none";
    favBtn.style.border = "none";
    favBtn.style.padding = "0";
    favBtn.style.cursor = "pointer";
    favBtn.style.font = "inherit"; // usa misma fuente del texto
    favBtn.style.color = "#0077cc"; // mismo color de texto
    favBtn.style.textDecoration = "none";

    const info = document.querySelector(".producto-info");
    if (info) info.appendChild(favBtn);
  }

  const pid = producto.id || producto.ID;
  const isFav = esFavorito(pid);
  favBtn.textContent = isFav ? "❤️ Favorito" : "❤️ Agregar a Favoritos";

  favBtn.onclick = (e) => {
    e.stopPropagation();
    toggleFavorito(producto);
    favBtn.textContent = esFavorito(pid) ? "❤️ Favorito" : "❤️ Agregar a Favoritos";
  };
}

function irAlInicio() {
  ocultarControlesBusqueda(false);
  location.href = "index.html";
}

function volverAlProducto() {
  const section = document.getElementById("favoritosSection");
  if (section) section.style.display = "none";
  document.querySelector(".producto-container")?.style.setProperty("display", "grid");
  document.querySelector(".similares")?.style.setProperty("display", "block");
}

function ensureFavoritosSection() {
  let favSection = document.getElementById("favoritosSection");
  if (!favSection) {
    favSection = document.createElement("section");
    favSection.id = "favoritosSection";
    favSection.style.display = "none";
    favSection.style.padding = "20px";
    favSection.innerHTML = `
      <h3>Mis Favoritos</h3>
      <div id="favoritosGrid" class="similares-grid"></div>
      <div style="display:flex; gap:10px; margin-top:10px; flex-wrap:wrap;">
        <button id="volverProductoBtn" class="btn-volver">Volver al producto</button>
        <button id="volverInicioBtn" class="btn-volver">Volver al inicio</button>
      </div>
    `;
    const similaresSection = document.querySelector(".similares");
    if (similaresSection?.parentNode) {
      similaresSection.parentNode.insertBefore(favSection, similaresSection.nextSibling);
    } else {
      document.body.appendChild(favSection);
    }
  }
  return {
    section: favSection,
    grid: favSection.querySelector("#favoritosGrid"),
    btnVolverProd: favSection.querySelector("#volverProductoBtn"),
    btnVolverInicio: favSection.querySelector("#volverInicioBtn"),
  };
}

function mostrarFavoritos() {
  ocultarControlesBusqueda(true);
  const favs = getFavoritos();

  // 🏠 Vista de favoritos dentro de index.html
  if (window.location.pathname.toLowerCase().includes("index.html") || window.location.pathname === "/") {
    const grid = document.getElementById("catalog");
    const pagination = document.getElementById("pagination");

    if (grid) {
      grid.innerHTML = "";

      if (favs.length === 0) {
        const msg = document.createElement("p");
        msg.textContent = "No hay favoritos guardados.";
        grid.appendChild(msg);
      } else {
        favs.forEach(p => {
          const card = document.createElement("div");
          card.className = "item";

          const img = document.createElement("img");
          img.src = imgPath(p.imagen1 || p.imagen || "");
          img.alt = p.nombre || "";
          img.style.cursor = "pointer";
          img.addEventListener("click", () => {
            const pid = p.id || p.ID;
            if (pid) window.location.href = `productos.html?id=${encodeURIComponent(pid)}`;
          });

          const pName = document.createElement("p");
          pName.textContent = p.nombre || "";

          const pPrice = document.createElement("p");
          pPrice.textContent = p.precio ? `$${p.precio}` : "";

          // 🔁 Botón para quitar de favoritos (toggle)
          const btnFav = document.createElement("button");
          btnFav.textContent = "💔 Quitar de Favoritos";
          btnFav.addEventListener("click", (e) => {
            e.stopPropagation();
            toggleFavorito(p);
            mostrarFavoritos(); // re-render
          });

          card.append(img, pName, pPrice, btnFav);
          grid.appendChild(card);
        });
      }

      // 🔹 Eliminar botón previo si ya existía (evita duplicados)
      document.getElementById("btnRegresarInicio")?.remove();

      // 🔹 Crear botón regresar al inicio (fuera del grid)
      const btnInicio = document.createElement("button");
      btnInicio.id = "btnRegresarInicio";
      btnInicio.className = "btn-volver";
      btnInicio.style.marginTop = "20px";
      btnInicio.textContent = "Regresar al inicio";
      btnInicio.addEventListener("click", irAlInicio);

      grid.insertAdjacentElement("afterend", btnInicio);
    }

    if (pagination) pagination.style.display = "none";
    return;
  }

  // ----- Vista de favoritos en productos.html -----
  const { section, grid, btnVolverProd, btnVolverInicio } = ensureFavoritosSection();

  document.querySelector(".producto-container")?.style.setProperty("display", "none");
  document.querySelector(".similares")?.style.setProperty("display", "none");

  section.style.display = "block";
  grid.innerHTML = "";

  if (favs.length === 0) {
    grid.innerHTML = `<p>No hay favoritos guardados.</p>`;
  } else {
    favs.forEach(p => {
      const card = document.createElement("div");
      card.className = "item";

      const img = document.createElement("img");
      img.src = imgPath(p.imagen1 || p.imagen || "");
      img.alt = p.nombre || "";
      img.style.cursor = "pointer";
      img.addEventListener("click", () => {
        const pid = p.id || p.ID;
        if (pid) window.location.href = `productos.html?id=${encodeURIComponent(pid)}`;
      });

      const pName = document.createElement("p");
      pName.textContent = p.nombre || "";

      const pPrice = document.createElement("p");
      pPrice.textContent = p.precio ? `$${p.precio}` : "";

      // (opcional) botón para quitar aquí también:
      const btnFav = document.createElement("button");
      btnFav.textContent = "💔 Quitar de Favoritos";
      btnFav.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFavorito(p);
        mostrarFavoritos(); // re-render
      });

      card.append(img, pName, pPrice, btnFav);
      grid.appendChild(card);
    });
  }

  if (btnVolverProd) btnVolverProd.onclick = volverAlProducto;

  // 🔹 Mover el botón "Regresar al inicio" debajo del grid (si existe en esta vista)
  if (btnVolverInicio) {
    btnVolverInicio.onclick = irAlInicio;
    grid.insertAdjacentElement("afterend", btnVolverInicio);
  }
}


/* Ocultar */
function ocultarControlesBusqueda(ocultar) {
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearch");
  const categorySelect = document.getElementById("categorySelect");
  const sortSelect = document.getElementById("sortSelect");

  if (searchInput) searchInput.style.display = ocultar ? "none" : "";
  if (clearBtn) clearBtn.style.display = ocultar ? "none" : "";
  if (categorySelect) categorySelect.style.display = ocultar ? "none" : "";
  if (sortSelect) sortSelect.style.display = ocultar ? "none" : "";
}


function obtenerDatos() {
  const cacheTime = Number(localStorage.getItem(CACHE_TIME_KEY) || 0);
  const now = Date.now();

  if (cacheTime && (now - cacheTime) < CACHE_DURATION) {
    const cacheData = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
    if (cacheData.length > 0) return Promise.resolve(cacheData);
  }

  return fetch(SHEET_URL)
    .then(r => r.json())
    .then(data => {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(CACHE_TIME_KEY, String(now));
      return data;
    });
}

/* ====== MODO OSCURO / HEADER / MENÚ MÓVIL ====== */
function initUI() {
  const body = document.body;
  const header = document.getElementById('header');
  const darkToggle = document.getElementById('darkModeToggle');

  // Modo oscuro
  function setDarkMode(isDark) {
    body.classList.toggle('dark', isDark);
    localStorage.setItem("modoOscuro", isDark.toString());
    if (darkToggle) darkToggle.checked = isDark;
  }
  setDarkMode(localStorage.getItem("modoOscuro") === "true");
  if (darkToggle) darkToggle.addEventListener('change', () => setDarkMode(darkToggle.checked));

  // Header sticky
  window.addEventListener('scroll', () => {
    if (header) header.classList.toggle('solid', window.scrollY > 50);
  });

  // Menú móvil
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const closeMobileMenu = document.getElementById('closeMobileMenu');
  const mobileOverlay = document.getElementById('mobileOverlay');

  if (hamburgerBtn && mobileMenu && closeMobileMenu && mobileOverlay) {
    const closeMenu = () => {
      mobileMenu.classList.remove('show');
      mobileOverlay.classList.remove('show');
    };
    hamburgerBtn.addEventListener('click', () => {
      mobileMenu.classList.add('show');
      mobileOverlay.classList.add('show');
    });
    closeMobileMenu.addEventListener('click', closeMenu);
    mobileOverlay.addEventListener('click', closeMenu);

    document.getElementById('verTodoBtnMobile')?.addEventListener('click', () => {
      irAlInicio();
      closeMenu();
    });
    document.getElementById('verFavoritosBtnMobile')?.addEventListener('click', () => {
      mostrarFavoritos();
      closeMenu();
    });
  }

  // Botones favoritos / inicio (desktop)
  document.getElementById("verFavoritosBtn")?.addEventListener("click", e => {
    e.preventDefault();
    mostrarFavoritos();
  });
  document.getElementById("verTodoBtn")?.addEventListener("click", e => {
    e.preventDefault();
    irAlInicio();
  });
}

function initIndexPage() {
  const grid = document.getElementById("catalog");
  if (!grid) return;

  const loader = document.getElementById("catalogLoader");
  const paginationEl = document.getElementById("pagination");
  const searchInput = document.getElementById("searchInput");
  const clearBtn = document.getElementById("clearSearch");
  const categorySelect = document.getElementById("categorySelect");
  const sortSelect = document.getElementById("sortSelect");

  // Estado
  let withIndex = [];   // [{ p, idx }]
  let filtered = [];
  let page = 1;
  const pageSize = 20;

  const showLoader = (show) => { if (loader) loader.style.display = show ? "block" : "none"; };
  const norm = (s) => (s || "").toString().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // quita acentos

  const precioNum = (p) => {
    const raw = (p.precio || "").toString()
      .replace(/[^\d.,-]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    const n = Number(raw);
    return isNaN(n) ? 0 : n;
  };

  const newestKey = (p, idx) => {
    for (const k of ["fecha", "agregado", "added"]) {
      if (p[k]) {
        const t = Date.parse(p[k]);
        if (!isNaN(t)) return t;
      }
    }
    const idstr = (p.id || p.ID || "").toString();
    const m = idstr.match(/(\d+)/);
    if (m) return parseInt(m[1], 10);
    return idx; // fallback al orden original
  };

  function applyFiltersAndSort() {
    const q = norm(searchInput?.value || "");
    const catSel = norm(categorySelect?.value || "all");

    let arr = withIndex.slice(); // copia
    arr = arr.filter(({ p }) => {
      const cat = norm(p.categoria || "");
      const okCat = (catSel === "all") || cat === catSel;
      if (!okCat) return false;
      if (!q) return true;
      const haystack = `${norm(p.nombre)} ${norm(p.descripcion)} ${cat}`;
      return haystack.includes(q);
    });

    const sortVal = (sortSelect?.value || "default");
    if (sortVal === "low") {
      arr.sort((a, b) => precioNum(a.p) - precioNum(b.p));
    } else if (sortVal === "high") {
      arr.sort((a, b) => precioNum(b.p) - precioNum(a.p));
    } else if (sortVal === "newest") {
      arr.sort((a, b) => newestKey(b.p, b.idx) - newestKey(a.p, a.idx));
    } else {
      // default → orden original
      arr.sort((a, b) => a.idx - b.idx);
    }

    filtered = arr.map(x => x.p);
    page = 1;
    render();
  }

  function buildCard(p) {
    const card = document.createElement("div");
    card.className = "item";

    const img = document.createElement("img");
    img.src = imgPath(p.imagen1 || p.imagen || "");
    img.alt = p.nombre || "";
    img.style.cursor = "pointer";
    img.addEventListener("click", () => {
      window.location.href = `productos.html?id=${encodeURIComponent(p.id || p.ID)}`;
    });

    const pName = document.createElement("p");
    pName.textContent = p.nombre || "";

    const pPrice = document.createElement("p");
    //pPrice.textContent = p.precio ? `$${p.precio}` : "";
    
    // Se comenta la linea de arriba para quitar el precio 


    const btnFav = document.createElement("button");
    const fav = esFavorito(p.id || p.ID);
    btnFav.textContent = fav ? "❤️ Favorito" : "❤️ Agregar a Favoritos";
    btnFav.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavorito(p);
      btnFav.textContent = esFavorito(p.id || p.ID) ? "❤️ Favorito" : "❤️ Agregar a Favoritos";
    });

    card.append(img, pName, pPrice, btnFav);
    return card;
  }

  function render() {
    grid.innerHTML = "";

    const total = filtered.length;
    if (total === 0) {
      const msg = document.createElement("p");
      msg.textContent = "No hay resultados con los filtros actuales.";
      grid.appendChild(msg);
      if (paginationEl) paginationEl.innerHTML = "";
      return;
    }

    const totalPages = Math.ceil(total / pageSize);
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * pageSize;
    const slice = filtered.slice(start, start + pageSize);
    slice.forEach(p => grid.appendChild(buildCard(p)));

    if (paginationEl) buildPagination(totalPages);
  }

function buildPagination(totalPages) {
  paginationEl.innerHTML = "";
  if (totalPages <= 1) return;

  const buscador = document.getElementById("searchInput"); // 👈 tu input de búsqueda

  const makeBtn = (label, targetPage, disabled = false, active = false) => {
    const btn = document.createElement("button");
    btn.textContent = label;
    if (active) btn.classList.add("active");
    if (disabled) btn.disabled = true;
    btn.addEventListener("click", () => {
      page = targetPage;
      render();

      // 👇 Subir hasta el buscador
      if (buscador) {
        buscador.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
    return btn;
  };

  // ⏮ Ir al inicio
  paginationEl.appendChild(makeBtn("⏮", 1, page === 1));

  // « Anterior
  paginationEl.appendChild(makeBtn("«", Math.max(1, page - 1), page === 1));

  // Páginas visibles (máx 4)
  const maxVisible = 3;
  let start = Math.max(1, page - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;
  if (end > totalPages) {
    end = totalPages;
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    paginationEl.appendChild(makeBtn(String(i), i, false, page === i));
  }

  // » Siguiente
  paginationEl.appendChild(makeBtn("»", Math.min(totalPages, page + 1), page === totalPages));

  // ⏭ Ir al final
  paginationEl.appendChild(makeBtn("⏭", totalPages, page === totalPages));
}

  // Eventos de controles
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      if (clearBtn) clearBtn.classList.toggle("visible", !!searchInput.value);
      applyFiltersAndSort();
    });
  }
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      clearBtn.classList.remove("visible");
      applyFiltersAndSort();
    });
  }
  if (categorySelect) {
    categorySelect.addEventListener("change", applyFiltersAndSort);
  }
  if (sortSelect) {
    sortSelect.addEventListener("change", applyFiltersAndSort);
  }

  // Carga de datos
  showLoader(true);
  obtenerDatos()
    .then(data => {
      showLoader(false);
      withIndex = data.map((p, idx) => ({ p, idx })); // guardamos orden original
      applyFiltersAndSort(); // pinta página 1
    })
    .catch(() => showLoader(false));
}

/* ====== PÁGINA PRODUCTOS ====== */
function initProductoPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = (urlParams.get("id") || "").trim();

  const nombreEl = document.getElementById("productoNombre");
  const precioEl = document.getElementById("productoPrecio");
  const enlaceEl = document.getElementById("productoEnlace");
  const descripcionEl = document.getElementById("productoDescripcion");
  const imagenPrincipalEl = document.getElementById("imagenPrincipal");
  const similaresGridEl = document.getElementById("similaresGrid");
  const productoBanner = document.querySelector(".producto-banner");

  // 🔹 Loader + contenedor
  const loader = document.getElementById("productoLoader");
  const contenedor = document.querySelector(".producto-container");

  if (!productId) {
    if (nombreEl) nombreEl.textContent = "No se especificó un producto (usa ?id=a0001)";
    return;
  }

  // Mostrar loader y ocultar contenido
  if (loader) loader.style.display = "block";
  if (contenedor) contenedor.style.display = "none";

  obtenerDatos().then(data => {
    const producto = data.find(p => (p.id || p.ID).toString().toLowerCase() === productId.toLowerCase());

    // Ocultar loader y mostrar contenido
    if (loader) loader.style.display = "none";
    if (contenedor) contenedor.style.removeProperty("display");


    if (!producto) {
      if (nombreEl) nombreEl.textContent = `Producto ${productId} no encontrado.`;
      return;
    }

    if (nombreEl) nombreEl.textContent = producto.nombre || "";
    if (precioEl) precioEl.textContent = producto.precio ? `$${producto.precio}` : "";
    if (enlaceEl) {
      enlaceEl.href = producto.enlace || "#";
      enlaceEl.target = "_blank";
      enlaceEl.rel = "noopener";
    }
    if (descripcionEl) descripcionEl.textContent = producto.descripcion || "";

    if (productoBanner && producto.imagen1) {
      productoBanner.style.backgroundImage = `url("${imgPath(producto.imagen1)}")`;
    }
    if (imagenPrincipalEl) {
      imagenPrincipalEl.src = imgPath(producto.imagen1 || producto.imagen || "");
      imagenPrincipalEl.alt = producto.nombre || "Producto";
    }

    // 🔹 Similares
    if (similaresGridEl && producto.categoria) {
      const candidatos = data.filter(p =>
        (p.categoria || "").toLowerCase() === (producto.categoria || "").toLowerCase() &&
        (p.id || p.ID) !== (producto.id || producto.ID)
      );

      similaresGridEl.innerHTML = "";
      candidatos.sort(() => Math.random() - 0.5);
      candidatos.slice(0, 4).forEach(sim => {
        const card = document.createElement("div");
        card.className = "item";

        // Enlace solo en la imagen
        const a = document.createElement("a");
        a.href = `productos.html?id=${encodeURIComponent(sim.id || sim.ID)}`;

        const img = document.createElement("img");
        img.src = imgPath(sim.imagen1 || sim.imagen || "");
        img.alt = sim.nombre || "";
        a.appendChild(img);

        const pName = document.createElement("p");
        pName.textContent = sim.nombre || "";

        // 🔁 Botón favoritos (toggle)
        const btnFav = document.createElement("button");
        const isFav = esFavorito(sim.id || sim.ID);
        btnFav.textContent = isFav ? "❤️ Favorito" : "❤️ Agregar a Favoritos";

        btnFav.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          let favs = getFavoritos();
          const pid = sim.id || sim.ID;
          const idx = favs.findIndex(f => (f.id || f.ID) === pid);

          if (idx >= 0) {
            favs.splice(idx, 1);
            btnFav.textContent = "❤️ Agregar a Favoritos";
          } else {
            favs.push({
              id: pid,
              nombre: sim.nombre,
              precio: sim.precio,
              imagen: sim.imagen1 || sim.imagen
            });
            btnFav.textContent = "❤️ Favorito";
          }
          localStorage.setItem("favoritos", JSON.stringify(favs));
        });

        card.append(a, pName, btnFav);
        similaresGridEl.appendChild(card);
      });
    }

    // Botón favorito principal
    renderBotonFavorito(producto);
  });
}

/* ====== INICIO ====== */
document.addEventListener("DOMContentLoaded", () => {
  initUI();
  const path = window.location.pathname.toLowerCase();
  if (path.includes("productos.html")) {
    initProductoPage();
  } else {
    initIndexPage();
  }
});
