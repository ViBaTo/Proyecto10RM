import { api, showNotification } from '../utils/api.js'

// Estado global para el componente
let currentBooks = []
let currentPagination = {}
let currentFilters = {}
let currentSort = { field: 'titulo', order: 'asc' }

const template = (
  books,
  favoriteBooks = [],
  pagination = {},
  filters = {},
  sort = {}
) => `
  <section id="books">
    <h2 class="welcome-message">
      ${
        localStorage.getItem('user')
          ? `Welcome ${JSON.parse(localStorage.getItem('user')).user.userName}`
          : 'Welcome Guest'
      }
    </h2>
    
    <!-- Filtros y búsqueda -->
    <div class="filters-section">
      <div class="search-box">
        <input type="text" id="searchInput" placeholder="Buscar libros..." value="${
          filters.search || ''
        }">
        <button id="searchBtn" class="btn btn-primary">🔍 Buscar</button>
      </div>
      
      <div class="filter-controls">
        <div class="filter-group">
          <label>Precio mínimo:</label>
          <input type="number" id="minPrice" placeholder="0" value="${
            filters.minPrice || ''
          }" min="0">
        </div>
        
        <div class="filter-group">
          <label>Precio máximo:</label>
          <input type="number" id="maxPrice" placeholder="100" value="${
            filters.maxPrice || ''
          }" min="0">
        </div>
        
        <div class="filter-group">
          <label>Valoración mínima:</label>
          <select id="minRating">
            <option value="">Cualquiera</option>
            <option value="1" ${
              filters.minRating === '1' ? 'selected' : ''
            }>1+ ⭐</option>
            <option value="2" ${
              filters.minRating === '2' ? 'selected' : ''
            }>2+ ⭐</option>
            <option value="3" ${
              filters.minRating === '3' ? 'selected' : ''
            }>3+ ⭐</option>
            <option value="4" ${
              filters.minRating === '4' ? 'selected' : ''
            }>4+ ⭐</option>
            <option value="5" ${
              filters.minRating === '5' ? 'selected' : ''
            }>5 ⭐</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Ordenar por:</label>
          <select id="sortField">
            <option value="titulo" ${
              sort.field === 'titulo' ? 'selected' : ''
            }>Título</option>
            <option value="precio" ${
              sort.field === 'precio' ? 'selected' : ''
            }>Precio</option>
            <option value="valoracion" ${
              sort.field === 'valoracion' ? 'selected' : ''
            }>Valoración</option>
            <option value="autor" ${
              sort.field === 'autor' ? 'selected' : ''
            }>Autor</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>Orden:</label>
          <select id="sortOrder">
            <option value="asc" ${
              sort.order === 'asc' ? 'selected' : ''
            }>Ascendente</option>
            <option value="desc" ${
              sort.order === 'desc' ? 'selected' : ''
            }>Descendente</option>
          </select>
        </div>
        
        <button id="applyFilters" class="btn btn-primary">Aplicar Filtros</button>
        <button id="clearFilters" class="btn btn-secondary">Limpiar</button>
      </div>
    </div>

    <!-- Estadísticas -->
    <div class="stats-section" id="statsSection" style="display: none;">
      <h3>Estadísticas</h3>
      <div class="stats-grid" id="statsGrid"></div>
    </div>

    <!-- Grid de libros -->
    <div class="books-grid">
      ${
        books.length === 0
          ? '<div class="no-books">No se encontraron libros con los filtros aplicados</div>'
          : books
              .map(
                (book) => `
          <div class="book-card">
            <img src="${book.caratula}" alt="${book.titulo}" class="book-cover">
            <div class="book-info">
              <h3 class="book-title">${book.titulo}</h3>
              <p class="book-author">${book.autor || 'Autor desconocido'}</p>
              <div class="book-rating">${book.valoracion} ★</div>
              <div class="book-price">${book.precio.toFixed(2)}€</div>
              ${
                localStorage.getItem('user')
                  ? `
                <div class="book-actions">
                  <button class="btn btn-favorite ${
                    favoriteBooks.includes(book._id) ? 'active' : ''
                  }" data-book-id="${book._id}">
                    ❤️ ${
                      favoriteBooks.includes(book._id)
                        ? 'Remove from favorites'
                        : 'Add to favorites'
                    }
                  </button>
                  <button class="btn btn-delete" data-book-id="${book._id}">
                    🗑️ Delete Book
                  </button>
                </div>
              `
                  : ''
              }
            </div>
          </div>
        `
              )
              .join('')
      }
    </div>

    <!-- Paginación -->
    ${
      pagination.totalPages > 1
        ? `
      <div class="pagination">
        <button id="prevPage" class="btn btn-secondary" ${
          !pagination.hasPrevPage ? 'disabled' : ''
        }>
          ← Anterior
        </button>
        
        <span class="page-info">
          Página ${pagination.currentPage} de ${pagination.totalPages}
          (${pagination.totalItems} libros total)
        </span>
        
        <button id="nextPage" class="btn btn-secondary" ${
          !pagination.hasNextPage ? 'disabled' : ''
        }>
          Siguiente →
        </button>
      </div>
    `
        : ''
    }
  </section>
`

const loadBooks = async (params = {}) => {
  try {
    const response = await api.getBooks(params)

    // Actualizar estado global
    currentBooks = response.data || response
    currentPagination = response.pagination || {}
    currentFilters = response.filters || {}
    currentSort = response.sort || { field: 'titulo', order: 'asc' }

    // Obtener favoritos si hay usuario logueado
    let favoriteBooks = []
    if (localStorage.getItem('user')) {
      const userData = JSON.parse(localStorage.getItem('user'))
      const user = await api.getUserById(userData.user._id)
      favoriteBooks = user.favoritos.map((fav) => fav._id || fav)
    }

    // Renderizar
    document.querySelector('main').innerHTML = template(
      currentBooks,
      favoriteBooks,
      currentPagination,
      currentFilters,
      currentSort
    )

    // Agregar event listeners
    addEventListeners()

    // Cargar estadísticas
    loadStats()
  } catch (error) {
    console.error('Error cargando los libros:', error)
    document.querySelector('main').innerHTML = `
      <div class="error-message">
        <h2>Error al cargar los libros</h2>
        <p>Por favor, intenta de nuevo más tarde.</p>
        <button class="btn btn-primary" onclick="location.reload()">Reintentar</button>
      </div>
    `
  }
}

const loadStats = async () => {
  try {
    const stats = await api.getBooksStats()
    const statsSection = document.getElementById('statsSection')
    const statsGrid = document.getElementById('statsGrid')

    if (stats && statsSection && statsGrid) {
      statsSection.style.display = 'block'
      statsGrid.innerHTML = `
        <div class="stat-card">
          <h4>Total de Libros</h4>
          <p>${stats.totalLibros}</p>
        </div>
        <div class="stat-card">
          <h4>Precio Promedio</h4>
          <p>${
            stats.precioPromedio ? stats.precioPromedio.toFixed(2) : '0'
          }€</p>
        </div>
        <div class="stat-card">
          <h4>Precio Mínimo</h4>
          <p>${stats.precioMinimo ? stats.precioMinimo.toFixed(2) : '0'}€</p>
        </div>
        <div class="stat-card">
          <h4>Precio Máximo</h4>
          <p>${stats.precioMaximo ? stats.precioMaximo.toFixed(2) : '0'}€</p>
        </div>
        <div class="stat-card">
          <h4>Valoración Promedio</h4>
          <p>${
            stats.valoracionPromedio ? stats.valoracionPromedio.toFixed(1) : '0'
          } ⭐</p>
        </div>
        <div class="stat-card">
          <h4>Mejor Valoración</h4>
          <p>${stats.valoracionMaxima || '0'} ⭐</p>
        </div>
      `
    }
  } catch (error) {
    console.error('Error cargando estadísticas:', error)
  }
}

const handleFavorites = async (bookId, button) => {
  try {
    const userData = JSON.parse(localStorage.getItem('user'))
    const userId = userData.user._id

    // Usar la función centralizada
    const updatedUser = await api.addFavorite(userId, bookId)

    // Actualizar el localStorage con los nuevos favoritos
    userData.user.favoritos = updatedUser.favoritos
    localStorage.setItem('user', JSON.stringify(userData))

    // Mostrar mensaje de éxito
    const isFavorite = updatedUser.favoritos.some(
      (fav) => fav._id === bookId || fav === bookId
    )
    showNotification(
      isFavorite ? 'Libro añadido a favoritos' : 'Libro eliminado de favoritos',
      'success'
    )

    // Recargar la página para actualizar el estado de todos los botones
    Books()
  } catch (error) {
    console.error('Error al modificar favoritos:', error)
    // El error ya se maneja en la función api
  }
}

const handleDeleteBook = async (bookId) => {
  try {
    const confirmDelete = window.confirm(
      '¿Estás seguro de que quieres eliminar este libro? Esta acción no se puede deshacer.'
    )

    if (!confirmDelete) return

    const userData = JSON.parse(localStorage.getItem('user'))
    if (!userData || !userData.token) {
      showNotification(
        'Por favor, inicia sesión para eliminar un libro',
        'warning'
      )
      return
    }

    // Usar la función centralizada
    await api.deleteBook(bookId)

    showNotification('Libro eliminado exitosamente', 'success')

    // Recargar la página para mostrar los cambios
    Books()
  } catch (error) {
    console.error('Error eliminando libro:', error)
    // El error ya se maneja en la función api
  }
}

const addEventListeners = () => {
  // Event listeners para favoritos
  document.querySelectorAll('.btn-favorite').forEach((button) => {
    button.addEventListener('click', () => {
      handleFavorites(button.dataset.bookId, button)
    })
  })

  // Event listeners para eliminar
  document.querySelectorAll('.btn-delete').forEach((button) => {
    button.addEventListener('click', () => {
      handleDeleteBook(button.dataset.bookId)
    })
  })

  // Event listeners para paginación
  const prevBtn = document.getElementById('prevPage')
  const nextBtn = document.getElementById('nextPage')

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPagination.hasPrevPage) {
        loadBooks({
          ...currentFilters,
          ...currentSort,
          page: currentPagination.currentPage - 1
        })
      }
    })
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPagination.hasNextPage) {
        loadBooks({
          ...currentFilters,
          ...currentSort,
          page: currentPagination.currentPage + 1
        })
      }
    })
  }

  // Event listeners para filtros
  const applyFiltersBtn = document.getElementById('applyFilters')
  const clearFiltersBtn = document.getElementById('clearFilters')
  const searchBtn = document.getElementById('searchBtn')

  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
      const filters = {
        search: document.getElementById('searchInput')?.value || '',
        minPrice: document.getElementById('minPrice')?.value || '',
        maxPrice: document.getElementById('maxPrice')?.value || '',
        minRating: document.getElementById('minRating')?.value || '',
        sort: document.getElementById('sortField')?.value || 'titulo',
        order: document.getElementById('sortOrder')?.value || 'asc',
        page: 1 // Resetear a primera página
      }

      loadBooks(filters)
    })
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      // Limpiar todos los campos
      document.getElementById('searchInput').value = ''
      document.getElementById('minPrice').value = ''
      document.getElementById('maxPrice').value = ''
      document.getElementById('minRating').value = ''
      document.getElementById('sortField').value = 'titulo'
      document.getElementById('sortOrder').value = 'asc'

      // Recargar sin filtros
      loadBooks({ page: 1 })
    })
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const searchValue = document.getElementById('searchInput')?.value || ''
      loadBooks({
        search: searchValue,
        page: 1
      })
    })
  }

  // Permitir búsqueda con Enter
  const searchInput = document.getElementById('searchInput')
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const searchValue = searchInput.value || ''
        loadBooks({
          search: searchValue,
          page: 1
        })
      }
    })
  }
}

const updateNavigation = () => {
  const loginLink = document.getElementById('loginlink')
  const registerLink = document.getElementById('registerlink')
  const logoutLink = document.getElementById('logoutlink')
  const favsLink = document.getElementById('favslink')
  const createLink = document.getElementById('createlink')
  const profileLink = document.getElementById('profilelink')

  if (localStorage.getItem('user')) {
    loginLink.style.display = 'none'
    registerLink.style.display = 'none'
    logoutLink.style.display = 'block'
    favsLink.style.display = 'block'
    createLink.style.display = 'block'
    profileLink.style.display = 'block'
  } else {
    loginLink.style.display = 'block'
    registerLink.style.display = 'block'
    logoutLink.style.display = 'none'
    favsLink.style.display = 'none'
    createLink.style.display = 'none'
    profileLink.style.display = 'none'
  }
}

const Books = async () => {
  // Asegurar que la navegación está actualizada
  updateNavigation()

  // Cargar libros con parámetros por defecto
  await loadBooks({ page: 1 })
}

export default Books
