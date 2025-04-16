import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

const userSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    favoritos: [
      { type: mongoose.Types.ObjectId, required: false, ref: 'libros' }
    ],
    rol: {
      type: String,
      required: true,
      default: 'user',
      enum: ['admin', 'user']
    }
  },
  {
    timestamps: true,
    collection: 'users'
  }
)

// Solo hashear la contraseña si ha sido modificada
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next()
  }
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

const User = mongoose.model('users', userSchema, 'users')
export default User
