import Login from './Login.js'
import { api, showNotification } from '../utils/api.js'

const template = () => `
  <section id="register">
    <form class="auth-form">
      <h2>Register</h2>
      <div class="form-group">
        <input type="text" placeholder="Username" id="username" required/>
      </div>
      <div class="form-group">
        <input type="email" placeholder="Email" id="email" required/>
      </div>
      <div class="form-group">
        <input type="password" id="password" placeholder="Password" required/>
      </div>
      <button id="registerbtn" class="btn btn-primary">Register</button>
    </form>
  </section>
`

const registerSubmit = async () => {
  const username = document.querySelector('#username').value.trim()
  const email = document.querySelector('#email').value.trim()
  const password = document.querySelector('#password').value

  // Validaciones
  if (!username || !email || !password) {
    showNotification('Por favor, completa todos los campos', 'warning')
    return
  }

  // Validación de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    showNotification('Por favor, introduce un email válido', 'warning')
    return
  }

  // Validación de contraseña
  if (password.length < 6) {
    showNotification(
      'La contraseña debe tener al menos 6 caracteres',
      'warning'
    )
    return
  }

  try {
    // Registrar usuario
    await api.register({
      userName: username,
      email: email,
      password: password
    })

    // Si el registro es exitoso, hacer login automáticamente
    const loginResponse = await api.login({
      userName: username,
      password: password
    })

    // El nuevo formato devuelve { token, user } directamente
    const userData = {
      token: loginResponse.token,
      user: loginResponse.user
    }

    // Guardar usuario en localStorage
    localStorage.setItem('user', JSON.stringify(userData))

    // Mostrar mensaje de éxito
    showNotification(`¡Registro exitoso! Bienvenido ${username}`, 'success')

    // Actualizar navegación
    updateNavigation()

    // Redirigir al login (que mostrará la página principal)
    Login()
  } catch (error) {
    // Mostrar detalles de validación si existen
    if (error.details && Array.isArray(error.details)) {
      error.details.forEach((err) => {
        showNotification(`${err.field}: ${err.message}`, 'error')
      })
    } else {
      showNotification(error.message || 'Error en el registro', 'error')
    }
    console.error('Error en el registro:', error)
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

const Register = () => {
  document.querySelector('main').innerHTML = template()

  const registerBtn = document.querySelector('#registerbtn')
  if (registerBtn) {
    registerBtn.addEventListener('click', (ev) => {
      ev.preventDefault()
      registerSubmit()
    })

    // Permitir registro con Enter
    const form = document.querySelector('.auth-form')
    if (form) {
      form.addEventListener('keypress', (ev) => {
        if (ev.key === 'Enter') {
          ev.preventDefault()
          registerSubmit()
        }
      })
    }
  }
}

export default Register
