import mongoose from 'mongoose'

const libroSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, 'El título del libro es obligatorio']
    },
    precio: {
      type: Number,
      required: [true, 'El precio del libro es obligatorio'],
      min: [0, 'El precio no puede ser negativo']
    },
    caratula: {
      type: String,
      required: [true, 'La URL de la carátula es obligatoria']
    },
    valoracion: {
      type: Number,
      required: [true, 'La valoración del libro es obligatoria'],
      min: [0, 'La valoración no puede ser menor que 0'],
      max: [5, 'La valoración no puede ser mayor que 5']
    },
    autor: {
      type: String,
      required: false
    }
  },
  {
    timestamps: true,
    collection: 'libros'
  }
)

const Libro = mongoose.model('libros', libroSchema, 'libros')
export default Libro
