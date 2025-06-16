import Books from './Books.js'
import { api, showNotification } from '../utils/api.js'

const template = () => `
  <section id="login">
    ${
      localStorage.getItem('user')
        ? `<h2>You are already logged<h2>`
        : `<form class="auth-form">
            <h2>Login</h2>
            <div class="form-group">
              <input type="text" placeholder="Username" id="username" required/>
            </div>
            <div class="form-group">
              <input type="password" id="password" placeholder="Password" required/>
            </div>
            <button id="loginbtn" class="btn btn-primary">Login</button>
          </form>`
    }
  </section>
`

const loginSubmit = async () => {
  const username = document.querySelector('#username').value.trim()
  const password = document.querySelector('#password').value

  // Validación básica
  if (!username || !password) {
    showNotification('Por favor, completa todos los campos', 'warning')
    return
  }

  try {
    const response = await api.login({
      userName: username,
      password: password
    })

    // El nuevo formato devuelve { token, user } directamente
    const userData = {
      token: response.token,
      user: response.user
    }

    // Guardar usuario en localStorage
    localStorage.setItem('user', JSON.stringify(userData))

    // Actualizar navegación
    updateNavigation()

    // Mostrar mensaje de éxito
    showNotification(`¡Bienvenido ${username}!`, 'success')

    // Redirigir a la página principal
    Books()
  } catch (error) {
    // El error ya se maneja en la función api, solo necesitamos mostrar un mensaje específico
    console.error('Error en el login:', error)
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

const Login = () => {
  document.querySelector('main').innerHTML = template()

  const loginBtn = document.querySelector('#loginbtn')
  if (loginBtn) {
    loginBtn.addEventListener('click', (ev) => {
      ev.preventDefault()
      loginSubmit()
    })

    // Permitir login con Enter
    const form = document.querySelector('.auth-form')
    if (form) {
      form.addEventListener('keypress', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault()
          loginSubmit()
        }
      })
    }
  }
}

export default Login
