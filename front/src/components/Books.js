const template = (books, favoriteBooks = []) => `
  <section id="books">
    <h2 class="welcome-message">
      ${
        localStorage.getItem('user')
          ? `Welcome ${JSON.parse(localStorage.getItem('user')).user.userName}`
          : 'Welcome Guest'
      }
    </h2>
    <div class="books-grid">
      ${books
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
        .join('')}
    </div>
  </section>
`

const handleFavorites = async (bookId, button) => {
  try {
    const userData = JSON.parse(localStorage.getItem('user'))
    const userId = userData.user._id
    const token = userData.token
    const isRemoving = button.classList.contains('active')

    const response = await fetch(
      `http://localhost:3000/api/v1/users/${userId}/favoritos`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          libroId: bookId
        })
      }
    )

    const responseData = await response.json()

    if (!response.ok) {
      throw new Error(responseData.error || 'Error al modificar favoritos')
    }

    // Actualizar el localStorage con los nuevos favoritos
    userData.user.favoritos = responseData.favoritos
    localStorage.setItem('user', JSON.stringify(userData))

    // Recargar la página para actualizar el estado de todos los botones
    Books()
  } catch (error) {
    console.error('Error al modificar favoritos:', error)
    alert(
      error.message ||
        'Error al modificar favoritos. Por favor, intenta de nuevo.'
    )
  }
}

const handleDeleteBook = async (bookId) => {
  try {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this book? This action cannot be undone.'
    )

    if (!confirmDelete) return

    const userData = JSON.parse(localStorage.getItem('user'))
    if (!userData || !userData.token) {
      alert('Please login to delete a book')
      window.location.hash = '#login'
      return
    }

    const response = await fetch(
      `http://localhost:3000/api/v1/books/${bookId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${userData.token}`
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to delete book')
    }

    alert('Book deleted successfully!')
    // Recargar la página para mostrar los cambios
    Books()
  } catch (error) {
    console.error('Error deleting book:', error)
    alert('Error deleting book. Please try again.')
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
  try {
    // Asegurar que la navegación está actualizada
    updateNavigation()

    // Obtener los libros
    const response = await fetch('http://localhost:3000/api/v1/books')
    const books = await response.json()

    // Si hay un usuario logueado, obtener sus favoritos
    let favoriteBooks = []
    if (localStorage.getItem('user')) {
      const userData = JSON.parse(localStorage.getItem('user'))
      const userResponse = await fetch(
        `http://localhost:3000/api/v1/users/${userData.user._id}`,
        {
          headers: {
            Authorization: `Bearer ${userData.token}`
          }
        }
      )
      if (userResponse.ok) {
        const user = await userResponse.json()
        favoriteBooks = user.favoritos.map((fav) => fav._id || fav)
      }
    }

    document.querySelector('main').innerHTML = template(books, favoriteBooks)

    // Añadir event listeners a los botones
    if (localStorage.getItem('user')) {
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
    }
  } catch (error) {
    console.error('Error cargando los libros:', error)
    document.querySelector('main').innerHTML = `
      <div class="error-message">
        Error cargando los libros. Por favor, intenta de nuevo.
      </div>
    `
  }
}

export default Books
