// Middleware de logging para registrar peticiones y respuestas
const logger = (req, res, next) => {
  const start = Date.now()

  // Log de la petición entrante
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${
      req.originalUrl
    } - Iniciando petición`
  )

  // Log de headers importantes
  if (req.headers.authorization) {
    console.log(`[${new Date().toISOString()}] Authorization: Bearer ***`)
  }

  if (req.headers['user-agent']) {
    console.log(
      `[${new Date().toISOString()}] User-Agent: ${req.headers['user-agent']}`
    )
  }

  // Interceptar la respuesta para loggear el resultado
  const originalSend = res.send
  res.send = function (data) {
    const duration = Date.now() - start
    const statusCode = res.statusCode

    // Determinar el tipo de log basado en el código de estado
    let logLevel = 'INFO'
    if (statusCode >= 400 && statusCode < 500) {
      logLevel = 'WARN'
    } else if (statusCode >= 500) {
      logLevel = 'ERROR'
    }

    // Log de la respuesta
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${
        req.originalUrl
      } - ${statusCode} (${duration}ms) - ${logLevel}`
    )

    // Log adicional para errores
    if (statusCode >= 400) {
      try {
        const responseData = JSON.parse(data)
        if (responseData.error) {
          console.log(
            `[${new Date().toISOString()}] Error details: ${
              responseData.error
            } - ${responseData.message || 'Sin mensaje'}`
          )
        }
      } catch (e) {
        // Si no es JSON, loggear como string
        console.log(`[${new Date().toISOString()}] Response: ${data}`)
      }
    }

    // Llamar al método original
    return originalSend.call(this, data)
  }

  next()
}

// Función para loggear errores específicos
const logError = (error, req = null) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: error.message,
    stack: error.stack,
    ...(req && {
      method: req.method,
      url: req.originalUrl,
      headers: {
        'user-agent': req.headers['user-agent'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip']
      }
    })
  }

  console.error('ERROR LOG:', JSON.stringify(errorLog, null, 2))
}

// Función para loggear información de la aplicación
const logInfo = (message, data = {}) => {
  console.log(`[${new Date().toISOString()}] INFO: ${message}`, data)
}

// Función para loggear warnings
const logWarning = (message, data = {}) => {
  console.warn(`[${new Date().toISOString()}] WARN: ${message}`, data)
}

// Función para loggear operaciones de base de datos
const logDatabase = (operation, collection, duration, success = true) => {
  const logMessage = `DB ${operation} on ${collection} - ${duration}ms - ${
    success ? 'SUCCESS' : 'FAILED'
  }`

  if (success) {
    console.log(`[${new Date().toISOString()}] ${logMessage}`)
  } else {
    console.error(`[${new Date().toISOString()}] ${logMessage}`)
  }
}

// Función para loggear autenticación
const logAuth = (action, userId, success = true) => {
  const logMessage = `AUTH ${action} - User: ${userId} - ${
    success ? 'SUCCESS' : 'FAILED'
  }`

  if (success) {
    console.log(`[${new Date().toISOString()}] ${logMessage}`)
  } else {
    console.warn(`[${new Date().toISOString()}] ${logMessage}`)
  }
}

export { logger, logError, logInfo, logWarning, logDatabase, logAuth }
