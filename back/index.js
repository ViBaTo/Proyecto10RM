import dotenv from 'dotenv'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import usersRouter from './src/api/routes/users.js'
import librosRouter from './src/api/routes/libros.js'
import uploadRouter from './src/api/routes/upload.js'
import { logger } from './src/middlewares/logger.js'
import { errorHandler } from './src/middlewares/errorHandler.js'
import { logInfo, logError } from './src/middlewares/logger.js'

dotenv.config()

const app = express()

const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://proyecto10-rm.vercel.app'
]

// Middleware de logging
app.use(logger)

// Configuración de CORS
app.use(
  cors({
    origin: function (origin, callback) {
      // Permitir requests sin origin (como mobile apps o curl)
      if (!origin) return callback(null, true)

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          'The CORS policy for this site does not allow access from the specified Origin.'
        return callback(new Error(msg), false)
      }
      return callback(null, true)
    },
    credentials: true
  })
)

// Middleware para parsear JSON y URL-encoded
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Rutas de salud y estado
app.get('/', (req, res) => {
  res.json({
    message: 'Backend API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Función para conectar a la base de datos
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    logInfo('Conectado a la base de datos MongoDB')
  } catch (error) {
    logError(error)
    console.error('Error al conectar con la base de datos:', error)
    process.exit(1)
  }
}

// Rutas de la API
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/books', librosRouter)
app.use('/api/v1/upload', uploadRouter)

// Middleware para rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `La ruta ${req.originalUrl} no existe`,
    method: req.method,
    timestamp: new Date().toISOString()
  })
})

// Middleware global de manejo de errores (debe ir al final)
app.use(errorHandler)

const PORT = process.env.PORT || 3000

// Iniciar servidor
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      logInfo(`Servidor iniciado en http://localhost:${PORT}`)
      logInfo(`Ambiente: ${process.env.NODE_ENV || 'development'}`)
    })
  })
  .catch((error) => {
    logError(error)
    process.exit(1)
  })

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  logInfo('SIGTERM recibido, cerrando servidor...')
  process.exit(0)
})

process.on('SIGINT', () => {
  logInfo('SIGINT recibido, cerrando servidor...')
  process.exit(0)
})

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  logError(error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  logError(new Error(`Unhandled Rejection at: ${promise}, reason: ${reason}`))
  process.exit(1)
})
