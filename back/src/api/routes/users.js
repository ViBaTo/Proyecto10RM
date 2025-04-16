import { isAuth } from '../../middlewares/auth.js'
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

const usersRouter = Router()

usersRouter.get('/', getUsers)
usersRouter.get('/:id', getUserById)
usersRouter.post('/register', register)
usersRouter.post('/login', login)
usersRouter.put('/:id', isAuth, updateUser)
usersRouter.put('/:id/favoritos', isAuth, addFavorite)
usersRouter.delete('/:id', isAuth, deleteUser)

export default usersRouter
