import User from '../api/models/users.js'
import { verificarToken } from '../utils/jwt.js'

// Y al tener nuestros tokens, ahora podemos hacer nuestro middleware que deje o no pasar a diferentes verbos de nuestra API al usuario, comprobando que el token generado es válido y se corresponde tanto con el usuario que intenta pasar como con la clave secreta.

const isAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization
    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' })
    }

    const parsedToken = token.replace('Bearer ', '')
    const { userId } = verificarToken(parsedToken)

    if (!userId) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    // Por seguridad, ocultamos la contraseña en la respuesta
    user.password = null
    req.user = user

    next()
  } catch (error) {
    console.error('Error en isAuth:', error)
    return res.status(400).json({ error: 'No estás autorizado' })
  }
}

export { isAuth }
