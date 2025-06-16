import { isAuth } from '../../middlewares/auth.js'
import { validate, schemas } from '../../middlewares/validation.js'
import {
  getLibros,
  getLibroById,
  postLibro,
  updateLibro,
  deleteLibro,
  getLibrosStats
} from '../controllers/libros.js'
import { Router } from 'express'

const librosRouter = Router()

// Rutas públicas
librosRouter.get('/', getLibros)
librosRouter.get('/stats', getLibrosStats)
librosRouter.get('/:id', getLibroById)

// Rutas protegidas
librosRouter.post('/', isAuth, validate(schemas.book), postLibro)
librosRouter.put('/:id', isAuth, validate(schemas.book), updateLibro)
librosRouter.delete('/:id', isAuth, deleteLibro)

export default librosRouter
