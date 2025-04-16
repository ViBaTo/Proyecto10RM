const template = () => `
  <section id="favs">
    <h2>Your Favorites</h2>
    <ul id="bookscontainer">
    </ul>
  </section>
`

const getFavs = async () => {
  try {
    const userData = JSON.parse(localStorage.getItem('user'))
    if (!userData) {
      document.querySelector('#bookscontainer').innerHTML =
        '<li>Please login to see your favorites</li>'
      return
    }

    const userId = userData.user._id
    const token = userData.token

    const response = await fetch(
      `http://localhost:3000/api/v1/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      throw new Error('Error fetching favorites')
    }

    const data = await response.json()
    const books = data.favoritos

    const booksContainer = document.querySelector('#bookscontainer')

    if (!books || books.length === 0) {
      booksContainer.innerHTML = '<li>You have no favorites yet</li>'
      return
    }

    booksContainer.innerHTML = '' // Limpiar el contenedor antes de añadir nuevos elementos

    for (const book of books) {
      const li = document.createElement('li')
      li.innerHTML = `
        <img src="${book.caratula}" alt="${book.titulo}"/>
        <h3>${book.titulo}</h3>
        <h4>${book.autor}</h4>
        <h5>${book.valoracion} ★</h5>
        <h5>${book.precio}€</h5>
      `
      booksContainer.appendChild(li)
    }
  } catch (error) {
    console.error('Error loading favorites:', error)
    document.querySelector('#bookscontainer').innerHTML =
      '<li>Error loading favorites</li>'
  }
}

const Favorites = () => {
  document.querySelector('main').innerHTML = template()
  getFavs()
}

export default Favorites
