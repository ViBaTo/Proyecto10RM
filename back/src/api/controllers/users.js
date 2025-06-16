//En este controlador vamos a tener los métodos para obtener todos los usuarios, obtener un usuario por su ID, registrar un usuario y actualizar un usuario.

// Implementaremos funciones extras como la comprobación de usuarios existentes, que la contraseña insertada en el login sea correspondiente a la encriptada e incluso insertar un rol por defecto a la hora de guardar un nuevo usuario en la base de datos:

import { generarToken } from '../../utils/jwt.js'
import User from '../models/users.js'
import bcrypt from 'bcrypt'
import {
  createNotFoundError,
  createValidationError
} from '../../middlewares/errorHandler.js'
import { logDatabase, logError, logAuth } from '../../middlewares/logger.js'

const getUsers = async (req, res, next) => {
  const startTime = Date.now()

  try {
    const users = await User.find().populate('favoritos')

    const duration = Date.now() - startTime
    logDatabase('FIND', 'users', duration, true)

    return res.status(200).json({
      success: true,
      data: users
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logDatabase('FIND', 'users', duration, false)
    logError(error, req)
    next(error)
  }
}

const getUserById = async (req, res, next) => {
  const startTime = Date.now()

  try {
    const { id } = req.params
    const user = await User.findById(id).populate('favoritos')

    if (!user) {
      throw createNotFoundError('Usuario')
    }

    const duration = Date.now() - startTime
    logDatabase('FIND_BY_ID', 'users', duration, true)

    return res.status(200).json({
      success: true,
      data: user
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logDatabase('FIND_BY_ID', 'users', duration, false)
    logError(error, req)
    next(error)
  }
}

const register = async (req, res, next) => {
  const startTime = Date.now()

  try {
    console.log('Intentando registrar usuario:', req.body)

    // Verificar si ya existe un usuario con ese nombre o email
    const userDuplicated = await User.findOne({
      $or: [{ userName: req.body.userName }, { email: req.body.email }]
    })

    if (userDuplicated) {
      if (userDuplicated.userName === req.body.userName) {
        throw createValidationError(
          'userName',
          'El nombre de usuario ya existe'
        )
      }
      throw createValidationError('email', 'El email ya existe')
    }

    const newUser = new User({
      userName: req.body.userName,
      email: req.body.email,
      password: req.body.password,
      rol: 'user'
    })

    const user = await newUser.save()

    const duration = Date.now() - startTime
    logDatabase('INSERT', 'users', duration, true)
    logAuth('REGISTER', user._id, true)

    // Devolver una versión "segura" del usuario (sin password)
    const safeUser = {
      _id: user._id,
      userName: user.userName,
      email: user.email,
      favoritos: user.favoritos,
      rol: user.rol
    }

    return res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: safeUser
    })
  } catch (error) {
    console.error('Error en registro:', error)
    if (error.details) {
      console.error('Detalles del error:', error.details)
    }
    const duration = Date.now() - startTime
    logDatabase('INSERT', 'users', duration, false)
    logAuth('REGISTER', 'unknown', false)
    logError(error, req)
    next(error)
  }
}

const login = async (req, res, next) => {
  const startTime = Date.now()

  try {
    const { userName, password } = req.body
    const user = await User.findOne({ userName }).populate('favoritos')

    if (!user) {
      logAuth('LOGIN', 'unknown', false)
      throw createValidationError(
        'credentials',
        'Usuario o contraseña incorrectos'
      )
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (isPasswordValid) {
      const token = generarToken(user._id)

      const duration = Date.now() - startTime
      logDatabase('FIND', 'users', duration, true)
      logAuth('LOGIN', user._id, true)

      // Crea un objeto "seguro" sin la contraseña
      const safeUser = {
        _id: user._id,
        userName: user.userName,
        email: user.email,
        favoritos: user.favoritos,
        rol: user.rol
      }

      return res.status(200).json({
        success: true,
        message: 'Login exitoso',
        data: {
          token,
          user: safeUser
        }
      })
    } else {
      logAuth('LOGIN', user._id, false)
      throw createValidationError(
        'credentials',
        'Usuario o contraseña incorrectos'
      )
    }
  } catch (error) {
    logError(error, req)
    next(error)
  }
}

const updateUser = async (req, res, next) => {
  const startTime = Date.now()

  try {
    const { id } = req.params

    if (req.user._id.toString() !== id) {
      throw createValidationError(
        'permission',
        'No puedes modificar otros usuarios'
      )
    }

    const oldUser = await User.findById(id)
    if (!oldUser) {
      throw createNotFoundError('Usuario')
    }

    const newUser = new User(req.body)
    newUser._id = id
    newUser.favoritos = [...oldUser.favoritos, ...newUser.favoritos]

    const userUpdated = await User.findByIdAndUpdate(id, newUser, { new: true })

    const duration = Date.now() - startTime
    logDatabase('UPDATE', 'users', duration, true)

    return res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: userUpdated
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logDatabase('UPDATE', 'users', duration, false)
    logError(error, req)
    next(error)
  }
}

const addFavorite = async (req, res, next) => {
  const startTime = Date.now()

  try {
    const { id } = req.params
    const { libroId } = req.body

    if (req.user._id.toString() !== id) {
      throw createValidationError(
        'permission',
        'No puedes modificar otros usuarios'
      )
    }

    const user = await User.findById(id)
    if (!user) {
      throw createNotFoundError('Usuario')
    }

    // Si el libro ya está en favoritos, lo quitamos
    const index = user.favoritos.findIndex(
      (favId) => favId.toString() === libroId
    )
    if (index > -1) {
      user.favoritos.splice(index, 1)
    } else {
      // Si no está en favoritos, lo añadimos
      user.favoritos.push(libroId)
    }

    await user.save()
    const updatedUser = await User.findById(id).populate('favoritos')

    const duration = Date.now() - startTime
    logDatabase('UPDATE', 'users', duration, true)

    return res.status(200).json({
      success: true,
      message:
        index > -1
          ? 'Libro eliminado de favoritos'
          : 'Libro añadido a favoritos',
      data: updatedUser
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logDatabase('UPDATE', 'users', duration, false)
    logError(error, req)
    next(error)
  }
}

const deleteUser = async (req, res, next) => {
  const startTime = Date.now()

  try {
    const { id } = req.params

    if (req.user._id.toString() !== id) {
      throw createValidationError(
        'permission',
        'No puedes eliminar otros usuarios'
      )
    }

    const deletedUser = await User.findByIdAndDelete(id)

    if (!deletedUser) {
      throw createNotFoundError('Usuario')
    }

    const duration = Date.now() - startTime
    logDatabase('DELETE', 'users', duration, true)
    logAuth('DELETE', id, true)

    return res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      data: {
        _id: deletedUser._id,
        userName: deletedUser.userName,
        email: deletedUser.email
      }
    })
  } catch (error) {
    const duration = Date.now() - startTime
    logDatabase('DELETE', 'users', duration, false)
    logError(error, req)
    next(error)
  }
}

export {
  getUsers,
  getUserById,
  register,
  login,
  updateUser,
  addFavorite,
  deleteUser
}
