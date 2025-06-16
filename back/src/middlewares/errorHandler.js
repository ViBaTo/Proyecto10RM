// Middleware global para manejo de errores
const errorHandler = (err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  })

  // Errores de validación de Mongoose
  if (err.name === 'ValidationError') {
    const validationErrors = Object.keys(err.errors).map((field) => ({
      field,
      message: err.errors[field].message,
      value: err.errors[field].value
    }))

    return res.status(400).json({
      error: 'Error de validación',
      message: 'Los datos proporcionados no son válidos',
      details: validationErrors,
      timestamp: new Date().toISOString()
    })
  }

  // Errores de Cast de MongoDB (IDs inválidos)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'ID inválido',
      message: 'El ID proporcionado no es válido',
      details: {
        field: err.path,
        value: err.value
      },
      timestamp: new Date().toISOString()
    })
  }

  // Errores de duplicación (código 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(409).json({
      error: 'Dato duplicado',
      message: `El ${field} ya existe en el sistema`,
      details: {
        field,
        value: err.keyValue[field]
      },
      timestamp: new Date().toISOString()
    })
  }

  // Errores de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      message: 'El token de autenticación no es válido',
      timestamp: new Date().toISOString()
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      message: 'El token de autenticación ha expirado',
      timestamp: new Date().toISOString()
    })
  }

  // Errores de sintaxis JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'JSON inválido',
      message: 'El cuerpo de la petición no contiene JSON válido',
      timestamp: new Date().toISOString()
    })
  }

  // Errores de límite de tamaño
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Archivo demasiado grande',
      message: 'El archivo excede el tamaño máximo permitido',
      timestamp: new Date().toISOString()
    })
  }

  // Errores de tipo de archivo
  if (
    err.message &&
    err.message.includes('Solo se permiten archivos de imagen')
  ) {
    return res.status(400).json({
      error: 'Tipo de archivo no permitido',
      message: 'Solo se permiten archivos de imagen',
      timestamp: new Date().toISOString()
    })
  }

  // Error por defecto (500)
  const statusCode = err.statusCode || 500
  const message = err.message || 'Error interno del servidor'

  res.status(statusCode).json({
    error: 'Error del servidor',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Ha ocurrido un error interno'
        : message,
    details: err.details || null,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    timestamp: new Date().toISOString()
  })
}

// Clase personalizada para errores de la aplicación
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// Función para crear errores de validación
const createValidationError = (field, message) => {
  const error = new AppError(message, 400)
  error.field = field
  return error
}

// Función para crear errores de no encontrado
const createNotFoundError = (resource = 'Recurso') => {
  return new AppError(`${resource} no encontrado`, 404)
}

// Función para crear errores de acceso denegado
const createForbiddenError = (message = 'Acceso denegado') => {
  return new AppError(message, 403)
}

export {
  errorHandler,
  AppError,
  createValidationError,
  createNotFoundError,
  createForbiddenError
}
