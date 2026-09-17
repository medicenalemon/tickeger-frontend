const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    maxlength: [100, 'El título no puede tener más de 100 caracteres']
  },
  text: {
    type: String,
    required: [true, 'El texto es obligatorio'],
    maxlength: [2000, 'El texto no puede tener más de 2000 caracteres']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Template', templateSchema);
