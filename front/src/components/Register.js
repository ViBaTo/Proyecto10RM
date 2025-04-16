import Login from './Login.js'

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
  const username = document.querySelector('#username').value
  const email = document.querySelector('#email').value
  const password = document.querySelector('#password').value

  // Validación básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    alert('Please enter a valid email address')
    return
  }

  try {
    const data = await fetch('http://localhost:3000/api/v1/users/register', {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        userName: username,
        email: email,
        password: password
      })
    })

    if (data.ok) {
      // Si el registro es exitoso, hacemos login automáticamente
      const loginData = await fetch(
        'http://localhost:3000/api/v1/users/login',
        {
          headers: {
            'Content-Type': 'application/json'
          },
          method: 'POST',
          body: JSON.stringify({
            userName: username,
            password: password
          })
        }
      )

      const loginRes = await loginData.json()

      if (loginData.ok) {
        localStorage.setItem('user', JSON.stringify(loginRes))
        alert(`Welcome ${username}`)
        updateNavigation()
        Login()
      } else {
        alert('Registro exitoso. Por favor, inicia sesión.')
        Login()
      }
    } else {
      const errorData = await data.json()
      alert(errorData.error || 'Error en el registro')
    }
  } catch (error) {
    console.error('Error en el registro:', error)
    alert('Error en el registro. Por favor, intenta de nuevo.')
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

  document.querySelector('#registerbtn').addEventListener('click', (ev) => {
    ev.preventDefault()
    registerSubmit()
  })
}

export default Register
