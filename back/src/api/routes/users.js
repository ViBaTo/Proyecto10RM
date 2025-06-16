import { isAuth } from '../../middlewares/auth.js'
import { validate, schemas } from '../../middlewares/validation.js'
import {
  getUsers,
  getUserById,
  register,
  login,
  updateUser,
  addFavorite,
  deleteUser
} from '../controllers/users.js'
import { Router } from 'express'

console.log('Cargando rutas de usuarios')

const usersRouter = Router()

// Rutas públicas
usersRouter.get('/', getUsers)
usersRouter.get('/:id', getUserById)
usersRouter.post('/register', validate(schemas.userRegister), register)
usersRouter.post('/login', validate(schemas.userLogin), login)

// Rutas protegidas
usersRouter.put('/:id', isAuth, updateUser)
usersRouter.put(
  '/:id/favoritos',
  isAuth,
  validate(schemas.favorite),
  addFavorite
)
usersRouter.delete('/:id', isAuth, deleteUser)

export default usersRouter
