//En este controlador vamos a tener los métodos para obtener todos los usuarios, obtener un usuario por su ID, registrar un usuario y actualizar un usuario.

// Implementaremos funciones extras como la comprobación de usuarios existentes, que la contraseña insertada en el login sea correspondiente a la encriptada e incluso insertar un rol por defecto a la hora de guardar un nuevo usuario en la base de datos:

import { generarToken } from '../../utils/jwt.js'
import User from '../models/users.js'
import bcrypt from 'bcrypt'

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().populate('favoritos')
    return res.status(200).json(users)
  } catch (error) {
    return res.status(400).json({ error: 'Error getting users' })
  }
}

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await User.findById(id).populate('favoritos')
    return res.status(200).json(user)
  } catch (error) {
    return res.status(400).json({ error: 'Error getting user' })
  }
}

const register = async (req, res, next) => {
  try {
    // Verificar si ya existe un usuario con ese nombre o email
    const userDuplicated = await User.findOne({
      $or: [{ userName: req.body.userName }, { email: req.body.email }]
    })

    if (userDuplicated) {
      if (userDuplicated.userName === req.body.userName) {
        return res.status(400).json({ error: 'Username already exists' })
      }
      return res.status(400).json({ error: 'Email already exists' })
    }

    const newUser = new User({
      userName: req.body.userName,
      email: req.body.email,
      password: req.body.password,
      rol: 'user'
    })
    const user = await newUser.save()

    // Devolver una versión "segura" del usuario (sin password)
    const safeUser = {
      _id: user._id,
      userName: user.userName,
      email: user.email,
      favoritos: user.favoritos,
      rol: user.rol
    }
    return res.status(201).json(safeUser)
  } catch (error) {
    return res
      .status(400)
      .json({ error: 'Error registering user', details: error.message })
  }
}

const login = async (req, res, next) => {
  try {
    const { userName, password } = req.body
    const user = await User.findOne({ userName }).populate('favoritos')

    if (!user) {
      return res.status(400).json({ error: 'Incorrect user or password' })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (isPasswordValid) {
      const token = generarToken(user._id)
      // Crea un objeto "seguro" sin la contraseña
      const safeUser = {
        _id: user._id,
        userName: user.userName,
        email: user.email,
        favoritos: user.favoritos,
        rol: user.rol
      }
      return res.status(200).json({ token, user: safeUser })
    } else {
      return res.status(400).json({ error: 'Incorrect user or password' })
    }
  } catch (error) {
    console.error('Login error:', error)
    return res
      .status(400)
      .json({ error: 'Error making login', details: error.message })
  }
}

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params

    if (req.user._id.toString() !== id) {
      return res.status(400).json({ error: 'Cannot modify other users' })
    }

    const oldUser = await User.findById(id)
    const newUser = new User(req.body)
    newUser._id = id
    newUser.favoritos = [...oldUser.favoritos, ...newUser.favoritos]
    const userUpdated = await User.findByIdAndUpdate(id, newUser, { new: true })

    return res.status(200).json(userUpdated)
  } catch (error) {
    return res
      .status(400)
      .json({ error: 'Error updating user', details: error.message })
  }
}

const addFavorite = async (req, res, next) => {
  try {
    const { id } = req.params
    const { libroId } = req.body

    if (req.user._id.toString() !== id) {
      return res.status(400).json({ error: 'Cannot modify other users' })
    }

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
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
    return res.status(200).json(updatedUser)
  } catch (error) {
    console.error('Error en addFavorite:', error)
    return res.status(400).json({ error: 'Error modifying favorites' })
  }
}

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params

    if (req.user._id.toString() !== id) {
      return res.status(400).json({ error: 'Cannot delete other users' })
    }

    const deletedUser = await User.findByIdAndDelete(id)

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    return res.status(200).json({
      message: 'User deleted successfully',
      deletedUser: {
        _id: deletedUser._id,
        userName: deletedUser.userName,
        email: deletedUser.email
      }
    })
  } catch (error) {
    return res.status(400).json({
      error: 'Error deleting user',
      details: error.message
    })
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
