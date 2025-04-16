import { Router } from 'express'
import multer from 'multer'
import { uploadImage } from '../../config/cloudinary.js'
import jwt from 'jsonwebtoken'
import User from '../models/users.js'

// Configurar multer para almacenamiento temporal en disco
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp') // Guardar temporalmente en /tmp
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, file.fieldname + '-' + uniqueSuffix)
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Verificar que sea una imagen
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Solo se permiten archivos de imagen'))
    }
    cb(null, true)
  }
})

const uploadRouter = Router()

// Middleware de autenticación para FormData
const authFormData = async (req, res, next) => {
  try {
    console.log('=== Auth Middleware ===')
    console.log('Headers recibidos:', req.headers)

    // Obtener el token del header de autorización
    const authHeader = req.headers.authorization
    if (!authHeader) {
      console.log('No se encontró header de autorización')
      return res.status(401).json({ error: 'Token no proporcionado' })
    }

    console.log('Auth header:', authHeader)
    const token = authHeader.replace('Bearer ', '')
    console.log('Token extraído:', token)

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      console.log('Token decodificado:', decoded)
      const { userId } = decoded

      if (!userId) {
        console.log('No se encontró userId en el token')
        return res.status(401).json({ error: 'Token inválido' })
      }

      const user = await User.findById(userId)
      if (!user) {
        console.log('No se encontró usuario con id:', userId)
        return res.status(401).json({ error: 'Usuario no encontrado' })
      }

      console.log('Usuario encontrado:', user.userName)
      req.user = user
      next()
    } catch (jwtError) {
      console.error('Error al verificar el token:', jwtError)
      return res.status(401).json({ error: 'Token inválido o expirado' })
    }
  } catch (error) {
    console.error('Error en autenticación:', error)
    return res.status(401).json({ error: 'Error de autenticación' })
  }
}

uploadRouter.post(
  '/',
  authFormData,
  upload.single('image'),
  async (req, res) => {
    try {
      console.log('=== Inicio de proceso de upload ===')
      console.log('Headers recibidos:', req.headers)
      console.log('Usuario autenticado:', req.user)

      // Verificar que se recibió un archivo
      if (!req.file) {
        console.log('No se recibió ningún archivo')
        return res.status(400).json({ error: 'No se recibió ningún archivo' })
      }

      console.log('Archivo recibido:', {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      })

      // Subir a Cloudinary
      console.log('Intentando subir a Cloudinary...')
      const result = await uploadImage(req.file)
      console.log('Respuesta exitosa de Cloudinary:', result)

      res.status(200).json(result)
    } catch (error) {
      console.error('Error en proceso de upload:', {
        message: error.message,
        stack: error.stack
      })
      res.status(500).json({
        error: 'Error al subir el archivo',
        details: error.message
      })
    }
  }
)

export default uploadRouter
