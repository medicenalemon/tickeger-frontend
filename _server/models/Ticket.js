const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: [true, 'El comentario no puede estar vacío'],
    maxlength: [2000, 'El comentario no puede tener más de 2000 caracteres']
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

const ticketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    maxlength: [200, 'El título no puede tener más de 200 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    maxlength: [5000, 'La descripción no puede tener más de 5000 caracteres']
  },
  status: {
    type: String,
    enum: ['abierto', 'en_progreso', 'en_revision', 'resuelto', 'cerrado', 'rechazado'],
    default: 'abierto'
  },
  priority: {
    type: String,
    enum: ['baja', 'media', 'alta', 'urgente'],
    default: 'media'
  },
  category: {
    type: String,
    enum: ['mantenimiento', 'soporte_tecnico', 'solicitud_cambio', 'bug', 'accesos_permisos', 'consulta', 'hardware', 'redes', 'mejora', 'software', 'ciberseguridad', 'otro'],
    default: 'otro'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  comments: [commentSchema],
  history: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      required: true
    },
    field: String,
    oldValue: String,
    newValue: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    filename: String,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  relatedTickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket'
  }],
  closedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Auto-generate ticket number before saving
ticketSchema.pre('save', async function() {
  if (this.isNew) {
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketNumber = `TK-${String(count + 1).padStart(4, '0')}`;
  }
  // Set closedAt when status changes to 'cerrado' or 'resuelto'
  if (this.isModified('status') && ['cerrado', 'resuelto'].includes(this.status)) {
    this.closedAt = new Date();
  }
});

module.exports = mongoose.model('Ticket', ticketSchema);
