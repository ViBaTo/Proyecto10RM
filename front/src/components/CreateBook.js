import config from '../config.js'

const template = () => `
  <section id="create-book">
    <h2>Create New Book</h2>
    <div class="create-book-form">
      <form id="bookForm">
        <div class="form-group">
          <label for="titulo">Title</label>
          <input type="text" id="titulo" name="titulo" required>
        </div>
        <div class="form-group">
          <label for="autor">Author</label>
          <input type="text" id="autor" name="autor" required>
        </div>
        <div class="form-group">
          <label for="caratula">Cover Image</label>
          <input type="file" id="caratula" name="caratula" accept="image/*" required>
          <div id="image-preview"></div>
        </div>
        <div class="form-group">
          <label for="precio">Price (€)</label>
          <input type="number" id="precio" name="precio" step="0.01" required>
        </div>
        <div class="form-group">
          <label for="valoracion">Rating (1-5)</label>
          <input type="number" id="valoracion" name="valoracion" min="1" max="5" step="0.1" required>
        </div>
        <button type="submit" class="btn btn-primary">Create Book</button>
      </form>
    </div>
  </section>
`

const handleImagePreview = (event) => {
  const file = event.target.files[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = function (e) {
      const preview = document.getElementById('image-preview')
      preview.innerHTML = `<img src="${e.target.result}" alt="Preview" style="max-width: 200px; margin-top: 10px;">`
    }
    reader.readAsDataURL(file)
  }
}

const handleCreateBook = async (event) => {
  event.preventDefault()

  const userData = JSON.parse(localStorage.getItem('user'))
  console.log('User data from localStorage:', userData)

  if (!userData || !userData.token) {
    console.error('No token found in userData:', userData)
    alert('Please login to create a book')
    window.location.hash = '#login'
    return
  }

  try {
    const formData = new FormData(event.target)
    const imageFile = formData.get('caratula')
    const titulo = formData.get('titulo')

    if (!imageFile) {
      throw new Error('Please select an image file')
    }

    // Validar el tipo de archivo
    if (!imageFile.type.startsWith('image/')) {
      throw new Error('Please select a valid image file')
    }

    console.log('Archivo seleccionado:', {
      nombre: imageFile.name,
      tipo: imageFile.type,
      tamaño: imageFile.size
    })

    // Crear un nombre de archivo basado en el título del libro
    const fileName = titulo.toLowerCase().replace(/[^a-z0-9]/g, '_')
    const fileExtension = imageFile.name.split('.').pop()
    const newFileName = `${fileName}.${fileExtension}`

    // Crear un nuevo archivo con el nombre modificado
    const modifiedFile = new File([imageFile], newFileName, {
      type: imageFile.type
    })

    // Crear FormData para la imagen
    const imageFormData = new FormData()
    imageFormData.append('image', modifiedFile)

    console.log('Enviando archivo:', {
      nombre: modifiedFile.name,
      tipo: modifiedFile.type,
      tamaño: modifiedFile.size
    })

    console.log('Sending request with token:', userData.token)
    const cloudinaryResponse = await fetch(`${config.apiURL}/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${userData.token}`
      },
      body: imageFormData
    })

    console.log('Response headers:', [...cloudinaryResponse.headers.entries()])
    console.log('Response status:', cloudinaryResponse.status)

    if (!cloudinaryResponse.ok) {
      const errorText = await cloudinaryResponse.text()
      console.error('Error response text:', errorText)
      throw new Error(errorText || 'Failed to upload image')
    }

    let responseData
    try {
      responseData = await cloudinaryResponse.json()
      console.log('Datos de respuesta:', responseData)
    } catch (parseError) {
      console.error('Error parsing response:', parseError)
      throw new Error('Invalid response from server')
    }

    // Luego creamos el libro con la URL de la imagen
    const bookData = {
      titulo: titulo,
      autor: formData.get('autor'),
      caratula: responseData.url,
      precio: parseFloat(formData.get('precio')),
      valoracion: parseFloat(formData.get('valoracion'))
    }

    const response = await fetch(`${config.apiURL}/books`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userData.token}`
      },
      body: JSON.stringify(bookData)
    })

    const bookResponse = await response.json()

    if (!response.ok) {
      throw new Error(bookResponse.error || 'Failed to create book')
    }

    alert('Book created successfully!')
    event.target.reset()
    document.getElementById('image-preview').innerHTML = ''
    // Redirigir a la página de libros
    window.location.hash = '#'
  } catch (error) {
    console.error('Error completo:', error)
    alert(error.message || 'Error creating book. Please try again.')
  }
}

const CreateBook = () => {
  // Verificar si el usuario está autenticado
  const userData = localStorage.getItem('user')
  if (!userData) {
    alert('Please login to create a book')
    window.location.hash = '#login'
    return
  }

  document.querySelector('main').innerHTML = template()
  const form = document.getElementById('bookForm')
  form.addEventListener('submit', handleCreateBook)

  // Añadir preview de imagen
  document
    .getElementById('caratula')
    .addEventListener('change', handleImagePreview)
}

export default CreateBook
