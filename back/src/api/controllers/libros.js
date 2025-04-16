import Libro from '../models/libros.js'

const getLibros = async (req, res, next) => {
  try {
    const libros = await Libro.find()
    return res.status(200).json(libros)
  } catch (error) {
    return res.status(400).json('Error encontrando el libro')
  }
}

const getLibroById = async (req, res, next) => {
  try {
    const { id } = req.params
    const libro = await Libro.findById(id)
    return res.status(200).json(libro)
  } catch (error) {
    return res.status(400).json('Error encontrando el libro')
  }
}

const postLibro = async (req, res, next) => {
  try {
    if (Array.isArray(req.body)) {
      // Si es un array, validamos cada libro antes de insertarlos
      const missingFieldsByBook = req.body.map((book) => {
        const missingFields = []
        if (!book.titulo) missingFields.push('titulo')
        if (!book.precio) missingFields.push('precio')
        if (!book.caratula) missingFields.push('caratula')
        if (!book.valoracion) missingFields.push('valoracion')
        return missingFields
      })

      // Si algún libro tiene campos faltantes, devolvemos error
      const booksWithMissingFields = missingFieldsByBook.filter(
        (fields) => fields.length > 0
      )
      if (booksWithMissingFields.length > 0) {
        return res.status(400).json({
          error: 'Campos requeridos faltantes',
          details: booksWithMissingFields.map((fields, index) => ({
            libro: index + 1,
            camposFaltantes: fields
          }))
        })
      }

      const libros = await Libro.insertMany(req.body)
      return res.status(201).json(libros)
    } else {
      // Si es un objeto único, validamos sus campos
      const missingFields = []
      if (!req.body.titulo) missingFields.push('titulo')
      if (!req.body.precio) missingFields.push('precio')
      if (!req.body.caratula) missingFields.push('caratula')
      if (!req.body.valoracion) missingFields.push('valoracion')

      if (missingFields.length > 0) {
        return res.status(400).json({
          error: 'Campos requeridos faltantes',
          camposFaltantes: missingFields
        })
      }

      const newLibro = new Libro(req.body)
      const libro = await newLibro.save()
      return res.status(201).json(libro)
    }
  } catch (error) {
    if (error.name === 'ValidationError') {
      const missingFields = Object.keys(error.errors).map((field) => ({
        campo: field,
        mensaje: error.errors[field].message
      }))
      return res.status(400).json({
        error: 'Error de validación',
        detalles: missingFields
      })
    }
    return res.status(400).json({
      error: 'Error al crear el libro',
      details: error.message
    })
  }
}

const updateLibro = async (req, res, next) => {
  try {
    const { id } = req.params
    const missingFields = []
    if (!req.body.titulo) missingFields.push('titulo')
    if (!req.body.precio) missingFields.push('precio')
    if (!req.body.caratula) missingFields.push('caratula')
    if (!req.body.valoracion) missingFields.push('valoracion')

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Campos requeridos faltantes',
        camposFaltantes: missingFields
      })
    }

    const newLibro = new Libro(req.body)
    newLibro._id = id
    const libroUpdated = await Libro.findByIdAndUpdate(id, newLibro, {
      new: true,
      runValidators: true
    })

    if (!libroUpdated) {
      return res.status(404).json({ error: 'Libro no encontrado' })
    }

    return res.status(200).json(libroUpdated)
  } catch (error) {
    if (error.name === 'ValidationError') {
      const missingFields = Object.keys(error.errors).map((field) => ({
        campo: field,
        mensaje: error.errors[field].message
      }))
      return res.status(400).json({
        error: 'Error de validación',
        detalles: missingFields
      })
    }
    return res.status(400).json({
      error: 'Error al actualizar el libro',
      details: error.message
    })
  }
}

const deleteLibro = async (req, res, next) => {
  try {
    const { id } = req.params
    const libro = await Libro.findByIdAndDelete(id)

    if (!libro) {
      return res.status(404).json({ error: 'Libro no encontrado' })
    }

    return res.status(200).json({
      mensaje: 'Ha sido eliminado con éxito',
      libroEliminado: libro
    })
  } catch (error) {
    return res.status(400).json('Error eliminando el libro')
  }
}

export { getLibros, getLibroById, postLibro, updateLibro, deleteLibro }
