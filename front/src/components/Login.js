import Books from './Books.js'

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
  const username = document.querySelector('#username').value
  const password = document.querySelector('#password').value

  try {
    const data = await fetch('http://localhost:3000/api/v1/users/login', {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        userName: username,
        password: password
      })
    })

    const dataRes = await data.json()

    if (data.ok) {
      localStorage.setItem('user', JSON.stringify(dataRes))
      updateNavigation()
      alert(`Welcome ${username}`)
      Books()
    } else {
      alert(dataRes.error || 'Error en el login')
    }
  } catch (error) {
    console.error('Error en el login:', error)
    alert('Error en el login. Por favor, intenta de nuevo.')
  }
}

const updateNavigation = () => {
  const loginLink = document.getElementById('loginlink')
  const registerLink = document.getElementById('registerlink')
  const logoutLink = document.getElementById('logoutlink')
  const favsLink = document.getElementById('favslink')

  if (localStorage.getItem('user')) {
    loginLink.style.display = 'none'
    registerLink.style.display = 'none'
    logoutLink.style.display = 'block'
    favsLink.style.display = 'block'
  } else {
    loginLink.style.display = 'block'
    registerLink.style.display = 'block'
    logoutLink.style.display = 'none'
    favsLink.style.display = 'none'
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
  }
}

export default Login
