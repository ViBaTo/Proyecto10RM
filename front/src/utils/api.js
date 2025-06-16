// Configuración de la API
const API_URL = 'http://localhost:3000/api/v1'

// Función fetch centralizada con manejo de errores y loading
export const apiRequest = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    body = null,
    headers = {},
    showLoading = true,
    customErrorHandler = null
  } = options

  // Mostrar loading si está habilitado
  if (showLoading) {
    showLoadingIndicator()
  }

  try {
    // Configurar headers por defecto
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...headers
    }

    // Agregar token de autenticación si existe
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (
      user.token &&
      !endpoint.includes('/register') &&
      !endpoint.includes('/login')
    ) {
      defaultHeaders.Authorization = `Bearer ${user.token}`
    }

    // Configurar opciones de fetch
    const fetchOptions = {
      method,
      headers: defaultHeaders
    }

    // Agregar body si existe
    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body)
    }

    // Realizar la petición
    const response = await fetch(`${API_URL}${endpoint}`, fetchOptions)
    const data = await response.json()

    // Ocultar loading
    if (showLoading) {
      hideLoadingIndicator()
    }

    // Manejar errores de respuesta
    if (!response.ok) {
      const error = {
        status: response.status,
        message: data.message || data.error || 'Error desconocido',
        details: data.details || null
      }

      if (customErrorHandler) {
        customErrorHandler(error)
      } else {
        handleApiError(error)
      }

      throw error
    }

    // Manejar el nuevo formato de respuesta del backend
    if (data.success !== undefined) {
      // Nuevo formato: { success, message, data }
      return data.data || data
    } else {
      // Formato antiguo: respuesta directa
      return data
    }
  } catch (error) {
    // Ocultar loading en caso de error
    if (showLoading) {
      hideLoadingIndicator()
    }

    // Si es un error de red
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = {
        status: 0,
        message: 'Error de conexión. Verifica tu conexión a internet.',
        details: null
      }

      if (customErrorHandler) {
        customErrorHandler(networkError)
      } else {
        handleApiError(networkError)
      }

      throw networkError
    }

    // Re-lanzar el error si ya fue manejado
    throw error
  }
}

// Funciones específicas para cada endpoint
export const api = {
  // Usuarios
  login: (credentials) =>
    apiRequest('/users/login', {
      method: 'POST',
      body: credentials
    }),

  register: (userData) =>
    apiRequest('/users/register', {
      method: 'POST',
      body: userData
    }),

  getUsers: () => apiRequest('/users'),

  getUserById: (id) => apiRequest(`/users/${id}`),

  updateUser: (id, userData) =>
    apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: userData
    }),

  addFavorite: (userId, libroId) =>
    apiRequest(`/users/${userId}/favoritos`, {
      method: 'PUT',
      body: { libroId }
    }),

  deleteUser: (id) =>
    apiRequest(`/users/${id}`, {
      method: 'DELETE'
    }),

  // Libros
  getBooks: (params = {}) => {
    const queryParams = new URLSearchParams()

    // Agregar parámetros de consulta
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value)
      }
    })

    const queryString = queryParams.toString()
    const endpoint = queryString ? `/books?${queryString}` : '/books'

    return apiRequest(endpoint)
  },

  getBookById: (id) => apiRequest(`/books/${id}`),

  createBook: (bookData) =>
    apiRequest('/books', {
      method: 'POST',
      body: bookData
    }),

  updateBook: (id, bookData) =>
    apiRequest(`/books/${id}`, {
      method: 'PUT',
      body: bookData
    }),

  deleteBook: (id) =>
    apiRequest(`/books/${id}`, {
      method: 'DELETE'
    }),

  getBooksStats: () => apiRequest('/books/stats'),

  // Upload
  uploadImage: (formData) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${user.token}`
      },
      body: formData
    }).then((response) => {
      if (!response.ok) {
        return response.json().then((data) => {
          throw new Error(data.message || data.error || 'Error al subir imagen')
        })
      }
      return response.json()
    })
  }
}

// Funciones de loading
function showLoadingIndicator() {
  // Crear o mostrar el indicador de loading
  let loader = document.getElementById('global-loader')
  if (!loader) {
    loader = document.createElement('div')
    loader.id = 'global-loader'
    loader.className = 'loading-overlay'
    loader.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>Cargando...</p>
      </div>
    `
    document.body.appendChild(loader)
  }
  loader.style.display = 'flex'
}

function hideLoadingIndicator() {
  const loader = document.getElementById('global-loader')
  if (loader) {
    loader.style.display = 'none'
  }
}

// Manejo de errores centralizado
function handleApiError(error) {
  let message = error.message

  // Personalizar mensajes según el tipo de error
  switch (error.status) {
    case 401:
      message =
        'No tienes permisos para realizar esta acción. Por favor, inicia sesión.'
      // Redirigir al login si no está autenticado
      if (!localStorage.getItem('user')) {
        setTimeout(() => {
          window.location.href = '#login'
        }, 2000)
      }
      break
    case 403:
      message = 'Acceso denegado. No tienes permisos suficientes.'
      break
    case 404:
      message = 'El recurso solicitado no fue encontrado.'
      break
    case 422:
      message = 'Datos inválidos. Por favor, verifica la información.'
      break
    case 500:
      message = 'Error interno del servidor. Por favor, intenta más tarde.'
      break
    case 0:
      message = 'Error de conexión. Verifica tu conexión a internet.'
      break
  }

  showNotification(message, 'error')
}

// Sistema de notificaciones
export function showNotification(message, type = 'info', duration = 5000) {
  // Crear elemento de notificación
  const notification = document.createElement('div')
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-message">${message}</span>
      <button class="notification-close">&times;</button>
    </div>
  `

  // Agregar al DOM
  document.body.appendChild(notification)

  // Mostrar con animación
  setTimeout(() => {
    notification.classList.add('show')
  }, 100)

  // Configurar cierre automático
  const closeTimeout = setTimeout(() => {
    closeNotification(notification)
  }, duration)

  // Configurar cierre manual
  const closeBtn = notification.querySelector('.notification-close')
  closeBtn.addEventListener('click', () => {
    clearTimeout(closeTimeout)
    closeNotification(notification)
  })

  // Cerrar al hacer clic fuera
  notification.addEventListener('click', (e) => {
    if (e.target === notification) {
      clearTimeout(closeTimeout)
      closeNotification(notification)
    }
  })
}

function closeNotification(notification) {
  notification.classList.remove('show')
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification)
    }
  }, 300)
}
