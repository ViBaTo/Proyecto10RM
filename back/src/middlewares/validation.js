import { createValidationError } from './errorHandler.js'

// Validaciones básicas
const validations = {
  // Validar que un campo existe y no está vacío
  required: (value, fieldName) => {
    if (value === undefined || value === null || value === '') {
      throw createValidationError(
        fieldName,
        `El campo ${fieldName} es obligatorio`
      )
    }
    return true
  },

  // Validar email
  email: (value, fieldName) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (value && !emailRegex.test(value)) {
      throw createValidationError(
        fieldName,
        `El ${fieldName} no tiene un formato válido`
      )
    }
    return true
  },

  // Validar longitud mínima
  minLength: (value, fieldName, min) => {
    console.log('minLength', { value, fieldName, min })
    if (value && value.length < min) {
      throw createValidationError(
        fieldName,
        `El ${fieldName} debe tener al menos ${min} caracteres`
      )
    }
    return true
  },

  // Validar longitud máxima
  maxLength: (value, fieldName, max) => {
    if (value && value.length > max) {
      throw createValidationError(
        fieldName,
        `El ${fieldName} no puede exceder ${max} caracteres`
      )
    }
    return true
  },

  // Validar número mínimo
  min: (value, fieldName, min) => {
    if (value !== undefined && value !== null && Number(value) < min) {
      throw createValidationError(
        fieldName,
        `El ${fieldName} debe ser mayor o igual a ${min}`
      )
    }
    return true
  },

  // Validar número máximo
  max: (value, fieldName, max) => {
    if (value !== undefined && value !== null && Number(value) > max) {
      throw createValidationError(
        fieldName,
        `El ${fieldName} debe ser menor o igual a ${max}`
      )
    }
    return true
  },

  // Validar que es un número
  isNumber: (value, fieldName) => {
    if (value !== undefined && value !== null && isNaN(Number(value))) {
      throw createValidationError(
        fieldName,
        `El ${fieldName} debe ser un número válido`
      )
    }
    return true
  },

  // Validar URL
  isUrl: (value, fieldName) => {
    if (value) {
      try {
        new URL(value)
      } catch {
        throw createValidationError(
          fieldName,
          `El ${fieldName} debe ser una URL válida`
        )
      }
    }
    return true
  },

  // Validar que es un ObjectId válido
  isObjectId: (value, fieldName) => {
    if (value && !/^[0-9a-fA-F]{24}$/.test(value)) {
      throw createValidationError(
        fieldName,
        `El ${fieldName} debe ser un ID válido`
      )
    }
    return true
  }
}

// Función para validar un objeto completo
const validateObject = (data, schema) => {
  const errors = []

  for (const [field, rules] of Object.entries(schema)) {
    try {
      const value = data[field]

      for (const rule of rules) {
        if (typeof rule === 'function') {
          rule(value, field)
        } else if (typeof rule === 'string') {
          validations[rule](value, field)
        } else if (Array.isArray(rule)) {
          const [validationName, ...params] = rule
          validations[validationName](value, field, ...params)
        }
      }
    } catch (error) {
      errors.push({
        field,
        message: error.message
      })
    }
  }

  if (errors.length > 0) {
    console.log('Errores de validación:', errors)
    const error = new Error('Error de validación')
    error.statusCode = 400
    error.details = errors
    throw error
  }

  return true
}

// Middleware de validación para rutas
const validate = (schema) => {
  return (req, res, next) => {
    console.log('Validando:', req.body)
    try {
      validateObject(req.body, schema)
      next()
    } catch (error) {
      next(error)
    }
  }
}

// Esquemas de validación predefinidos
const schemas = {
  // Esquema para registro de usuario
  userRegister: {
    userName: [validations.required, ['minLength', 3], ['maxLength', 50]],
    email: [validations.required, validations.email],
    password: [validations.required, ['minLength', 6]]
  },

  // Esquema para login
  userLogin: {
    userName: [validations.required],
    password: [validations.required]
  },

  // Esquema para crear/actualizar libro
  book: {
    titulo: [validations.required, ['minLength', 1], ['maxLength', 200]],
    precio: [validations.required, validations.isNumber, ['min', 0]],
    caratula: [validations.required, validations.isUrl],
    valoracion: [
      validations.required,
      validations.isNumber,
      ['min', 0],
      ['max', 5]
    ],
    autor: [['maxLength', 100]]
  },

  // Esquema para agregar favorito
  favorite: {
    libroId: [validations.required, validations.isObjectId]
  }
}

export { validate, schemas, validations }
