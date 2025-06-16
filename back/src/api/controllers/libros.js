import Libro from '../models/libros.js'
import {
  createNotFoundError,
  createValidationError
} from '../../middlewares/errorHandler.js'
import { logDatabase, logError } from '../../middlewares/logger.js'

const getLibros = async (req, res, next) => {
  const startTime = Date.now()

  try {
    // Parámetros de consulta
    const {
      sort = 'titulo',
      order = 'asc',
      page = 1,
      limit = 10,
      search = '',
      minPrice,
      maxPrice,
      minRating
    } = req.query

    // Construir filtros
    const filters = {}

    if (search) {
      filters.$or = [
        { titulo: { $regex: search, $options: 'i' } },
        { autor: { $regex: search, $options: 'i' } }
      ]
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filters.precio = {}
      if (minPrice !== undefined) filters.precio.$gte = Number(minPrice)
      if (maxPrice !== undefined) filters.precio.$lte = Number(maxPrice)
    }

    if (minRating !== undefined) {
      filters.valoracion = { $gte: Number(minRating) }
    }

    // Construir ordenamiento
    const sortOrder = order === 'desc' ? -1 : 1
    const sortOptions = { [sort]: sortOrder }

    // Calcular paginación
    const skip = (Number(page) - 1) * Number(limit)

    // Ejecutar consulta
    const [libros, total] = await Promise.all([
      Libro.find(filters).sort(sortOptions).skip(skip).limit(Number(limit)),
      Libro.countDocuments(filters)
    ])

    const duration = Date.now() - startTime
    logDatabase('FIND', 'libros', duration, true)

    // Calcular metadatos de paginación
    const totalPages = Math.ceil(total / Number(limit))
    const hasNextPage = Number(page) < totalPages
    const hasPrevPage = Number(page) > 1

    return res.status(200).json({
      success: true,
      data: libros,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: total,
        itemsPerPage: Number(limit),
        hasNextPage,
        hasPrevPage
      },
      filters: {
        search,
        minPrice,
        maxPrice,
        minRating
      },
      sort: {
        field: sort,
        order
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logDatabase('FIND', 'libros', duration, false)
    logError(error, req)
    next(error)
  }
}

const getLibroById = async (req, res, next) => {
  const startTime = Date.now()

  try {
    const { id } = req.params

    const libro = await Libro.findById(id)

    if (!libro) {
      throw createNotFoundError('Libro')
    }

    const duration = Date.now() - startTime
    logDatabase('FIND_BY_ID', 'libros', duration, true)

    return res.status(200).json({
      success: true,
      data: libro
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logDatabase('FIND_BY_ID', 'libros', duration, false)
    logError(error, req)
    next(error)
  }
}

const postLibro = async (req, res, next) => {
  const startTime = Date.now()

  try {
    let libros

    if (Array.isArray(req.body)) {
      // Crear múltiples libros
      libros = await Libro.insertMany(req.body)
      logDatabase('INSERT_MANY', 'libros', Date.now() - startTime, true)
    } else {
      // Crear un solo libro
      const newLibro = new Libro(req.body)
      libros = await newLibro.save()
      logDatabase('INSERT', 'libros', Date.now() - startTime, true)
    }

    return res.status(201).json({
      success: true,
      message: Array.isArray(libros)
        ? `${libros.length} libros creados exitosamente`
        : 'Libro creado exitosamente',
      data: libros
    })
  } catch (error) {
    logDatabase('INSERT', 'libros', Date.now() - startTime, false)
    logError(error, req)
    next(error)
  }
}

const updateLibro = async (req, res, next) => {
  const startTime = Date.now()

  try {
    const { id } = req.params

    const libro = await Libro.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    })

    if (!libro) {
      throw createNotFoundError('Libro')
    }

    const duration = Date.now() - startTime
    logDatabase('UPDATE', 'libros', duration, true)

    return res.status(200).json({
      success: true,
      message: 'Libro actualizado exitosamente',
      data: libro
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logDatabase('UPDATE', 'libros', duration, false)
    logError(error, req)
    next(error)
  }
}

const deleteLibro = async (req, res, next) => {
  const startTime = Date.now()

  try {
    const { id } = req.params

    const libro = await Libro.findByIdAndDelete(id)

    if (!libro) {
      throw createNotFoundError('Libro')
    }

    const duration = Date.now() - startTime
    logDatabase('DELETE', 'libros', duration, true)

    return res.status(200).json({
      success: true,
      message: 'Libro eliminado exitosamente',
      data: {
        _id: libro._id,
        titulo: libro.titulo
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logDatabase('DELETE', 'libros', duration, false)
    logError(error, req)
    next(error)
  }
}

// Función para obtener estadísticas de libros
const getLibrosStats = async (req, res, next) => {
  const startTime = Date.now()

  try {
    const stats = await Libro.aggregate([
      {
        $group: {
          _id: null,
          totalLibros: { $sum: 1 },
          precioPromedio: { $avg: '$precio' },
          precioMinimo: { $min: '$precio' },
          precioMaximo: { $max: '$precio' },
          valoracionPromedio: { $avg: '$valoracion' },
          valoracionMinima: { $min: '$valoracion' },
          valoracionMaxima: { $max: '$valoracion' }
        }
      }
    ])

    const duration = Date.now() - startTime
    logDatabase('AGGREGATE', 'libros', duration, true)

    return res.status(200).json({
      success: true,
      data: stats[0] || {
        totalLibros: 0,
        precioPromedio: 0,
        precioMinimo: 0,
        precioMaximo: 0,
        valoracionPromedio: 0,
        valoracionMinima: 0,
        valoracionMaxima: 0
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logDatabase('AGGREGATE', 'libros', duration, false)
    logError(error, req)
    next(error)
  }
}

export {
  getLibros,
  getLibroById,
  postLibro,
  updateLibro,
  deleteLibro,
  getLibrosStats
}
