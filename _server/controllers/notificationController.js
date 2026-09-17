const Notification = require('../models/Notification');

// @desc    Get all notifications for logged in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('ticket', 'title ticketNumber')
      .sort({ createdAt: -1 });
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener notificaciones', error: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    // Asegurarse de que el usuario logueado es el dueño de la notificación
    if (notification.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No tienes permisos para actualizar esta notificación' });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar notificación', error: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead
};
