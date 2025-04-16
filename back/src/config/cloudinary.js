import { v2 as cloudinary } from 'cloudinary'
import dotenv from 'dotenv'

// Asegurar que las variables de entorno están cargadas
dotenv.config()

// Verificar que todas las variables necesarias estén definidas
const requiredEnvVars = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
]
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} no está definida en las variables de entorno`)
  }
}

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
})

export const uploadImage = async (file) => {
  try {
    console.log('Configuración de Cloudinary:', {
      cloud_name: cloudinary.config().cloud_name,
      api_key: cloudinary.config().api_key,
      hasSecret: !!cloudinary.config().api_secret
    })

    if (!file) {
      throw new Error('No se proporcionó ningún archivo para subir')
    }

    console.log('Intentando subir imagen a Cloudinary...')
    console.log('Archivo recibido:', {
      nombre: file.originalname,
      tipo: file.mimetype,
      tamaño: file.size
    })

    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'Proyecto10',
      resource_type: 'auto',
      use_filename: true,
      unique_filename: true
    })

    console.log('Respuesta de Cloudinary:', result)
    return {
      url: result.secure_url,
      public_id: result.public_id
    }
  } catch (error) {
    console.error('Error detallado de Cloudinary:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    })
    throw error
  }
}

export default cloudinary
