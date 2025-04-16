const template = (user) => `
  <section id="profile">
    <div class="profile-container">
      <h2>My Profile</h2>
      <div class="profile-info">
        <div class="info-group">
          <label>Username:</label>
          <p>${user.userName}</p>
        </div>
        <div class="info-group">
          <label>Email:</label>
          <p>${user.email || 'No email set'}</p>
        </div>
        <div class="danger-zone">
          <h3>Danger Zone</h3>
          <p class="warning-text">Once you delete your account, there is no going back. Please be certain.</p>
          <button id="deleteAccount" class="btn btn-danger">Delete Account</button>
        </div>
      </div>
    </div>
  </section>
`

const handleDeleteAccount = async () => {
  try {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    )

    if (!confirmDelete) return

    const userData = JSON.parse(localStorage.getItem('user'))
    if (!userData || !userData.token) {
      alert('Please login to delete your account')
      window.location.hash = '#login'
      return
    }

    const response = await fetch(
      `http://localhost:3000/api/v1/users/${userData.user._id}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${userData.token}`
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to delete account')
    }

    // Limpiar localStorage y redirigir
    localStorage.removeItem('user')
    alert('Your account has been successfully deleted.')
    window.location.hash = '#'
    window.location.reload() // Recargar para actualizar la navegación
  } catch (error) {
    console.error('Error deleting account:', error)
    alert('Error deleting account. Please try again.')
  }
}

const Profile = async () => {
  try {
    // Verificar si el usuario está autenticado
    const userData = localStorage.getItem('user')
    if (!userData) {
      alert('Please login to view your profile')
      window.location.hash = '#login'
      return
    }

    const parsedUserData = JSON.parse(userData)

    // Obtener datos actualizados del usuario desde el backend
    const response = await fetch(
      `http://localhost:3000/api/v1/users/${parsedUserData.user._id}`,
      {
        headers: {
          Authorization: `Bearer ${parsedUserData.token}`
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch user data')
    }

    const user = await response.json()
    document.querySelector('main').innerHTML = template(user)

    // Añadir event listener para eliminar cuenta
    document
      .getElementById('deleteAccount')
      .addEventListener('click', handleDeleteAccount)
  } catch (error) {
    console.error('Error loading profile:', error)
    document.querySelector('main').innerHTML = `
      <div class="error-message">
        Error loading profile. Please try again.
      </div>
    `
  }
}

export default Profile
