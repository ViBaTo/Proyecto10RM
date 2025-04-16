import { isAuth } from '../../middlewares/auth.js'
import {
  getLibros,
  getLibroById,
  postLibro,
  updateLibro,
  deleteLibro
} from '../controllers/libros.js'
import { Router } from 'express'

const librosRouter = Router()

librosRouter.get('/', getLibros)
librosRouter.get('/:id', getLibroById)
librosRouter.post('/', isAuth, postLibro)
librosRouter.put('/:id', isAuth, updateLibro)
librosRouter.delete('/:id', isAuth, deleteLibro)

export default librosRouter
