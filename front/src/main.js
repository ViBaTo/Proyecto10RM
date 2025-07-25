// Importa el archivo de estilos CSS
import './style.css'

// Importa los módulos de las páginas
import Books from './components/Books.js'
import Login from './components/Login.js'
import Register from './components/Register.js'
import Favorites from './components/Favorites.js'
import CreateBook from './components/CreateBook.js'
import Profile from './components/Profile.js'
import { api, showNotification } from './utils/api.js'

// Estado global
let currentUser = null
let books = []

// Función para cargar los libros
async function loadBooks() {
  try {
    const response = await api.getBooks({ page: 1, limit: 10 })
    books = response.data || response
    renderBooks()
  } catch (error) {
    console.error('Error cargando los libros:', error)
    // El error ya se maneja en la función api
  }
}

// Función para renderizar los libros
function renderBooks() {
  const booksGrid = document.querySelector('.books-grid')
  if (!booksGrid) return

  booksGrid.innerHTML = books
    .map(
      (book) => `
    <div class="book-card">
      <img src="${book.caratula}" alt="${book.titulo}" class="book-cover">
      <div class="book-info">
        <h3 class="book-title">${book.titulo}</h3>
        <p class="book-author">${book.autor || 'Autor desconocido'}</p>
        <div class="book-rating">${book.valoracion} ★</div>
        <div class="book-price">${book.precio.toFixed(2)}€</div>
      </div>
    </div>
  `
    )
    .join('')
}

// Función para mostrar la página principal
function showMainPage() {
  const main = document.querySelector('main')
  main.innerHTML = `
    <h2 class="welcome-message">${
      currentUser ? `Welcome ${currentUser.userName}` : 'Welcome Guest'
    }</h2>
    <div class="books-grid"></div>
  `
  loadBooks()
}

// Event Listeners para la navegación
document.querySelector('#bookslink').addEventListener('click', (e) => {
  e.preventDefault()
  Books()
})

document.querySelector('#loginlink').addEventListener('click', (e) => {
  e.preventDefault()
  Login()
})

document.querySelector('#registerlink').addEventListener('click', (e) => {
  e.preventDefault()
  Register()
})

document.querySelector('#favslink').addEventListener('click', (e) => {
  e.preventDefault()
  Favorites()
})

document.querySelector('#createlink').addEventListener('click', (e) => {
  e.preventDefault()
  CreateBook()
})

document.querySelector('#profilelink').addEventListener('click', (e) => {
  e.preventDefault()
  Profile()
})

document.querySelector('#logoutlink').addEventListener('click', (e) => {
  e.preventDefault()

  // Mostrar confirmación antes de cerrar sesión
  if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
    localStorage.removeItem('user')
    showNotification('¡Hasta pronto!', 'info')
    updateNavigation()
    Books()
  }
})

// Función para actualizar la navegación según el estado de autenticación
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

// Función para verificar el estado de autenticación al cargar
const checkAuthStatus = () => {
  const userData = localStorage.getItem('user')
  if (userData) {
    try {
      const user = JSON.parse(userData)
      if (user.user && user.token) {
        currentUser = user.user
        showNotification(
          `Bienvenido de vuelta, ${user.user.userName}!`,
          'info',
          3000
        )
      } else {
        // Datos corruptos, limpiar
        localStorage.removeItem('user')
        currentUser = null
      }
    } catch (error) {
      console.error('Error parsing user data:', error)
      localStorage.removeItem('user')
      currentUser = null
    }
  }
}

// Inicialización
checkAuthStatus()
updateNavigation()
Books()
