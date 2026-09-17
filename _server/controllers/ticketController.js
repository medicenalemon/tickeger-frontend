const Ticket = require('../models/Ticket');
const Notification = require('../models/Notification');
const User = require('../models/User');

const createNotification = async (userId, ticketId, message, type) => {
  if (!userId) return;
  try {
    await Notification.create({
      user: userId,
      ticket: ticketId,
      message,
      type
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

const notifyUsers = async (ticket, message, type, reqUserId, extraUsers = []) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id');
    const userIdsToNotify = new Set();

    admins.forEach(admin => userIdsToNotify.add(admin._id.toString()));

    if (ticket.createdBy) {
      userIdsToNotify.add(ticket.createdBy._id ? ticket.createdBy._id.toString() : ticket.createdBy.toString());
    }

    if (ticket.assignedTo) {
      userIdsToNotify.add(ticket.assignedTo._id ? ticket.assignedTo._id.toString() : ticket.assignedTo.toString());
    }

    extraUsers.forEach(id => {
      if (id) userIdsToNotify.add(id.toString());
    });

    for (const userId of userIdsToNotify) {
      await createNotification(userId, ticket._id, message, type);
    }
  } catch (error) {
    console.error('Error in notifyUsers:', error);
  }
};

const getTickets = async (req, res) => {
  try {
    const { status, priority, category, assignedTo, search, startDate, endDate, export: isExport, page = 1, limit = 20 } = req.query;
    
    let query = {};

    if (req.user.role !== 'admin') {
      query.$or = [
        { createdBy: req.user._id },
        { assignedTo: req.user._id }
      ];
    }

    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (assignedTo) query.assignedTo = assignedTo;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    if (search) {
      const searchQuery = { $regex: search, $options: 'i' };
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: [{ title: searchQuery }, { description: searchQuery }, { ticketNumber: searchQuery }] }
        ];
        delete query.$or;
      } else {
        query.$or = [{ title: searchQuery }, { description: searchQuery }, { ticketNumber: searchQuery }];
      }
    }

    let ticketsPromise = Ticket.find(query)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    if (!isExport) {
      const skip = (parseInt(page) - 1) * parseInt(limit);
      ticketsPromise = ticketsPromise.skip(skip).limit(parseInt(limit));
    }

    const [tickets, total] = await Promise.all([
      ticketsPromise,
      Ticket.countDocuments(query)
    ]);

    res.json({
      tickets,
      total,
      page: isExport ? 1 : parseInt(page),
      pages: isExport ? 1 : Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ message: req.t('ticket.getTicketsError'), error: error.message });
  }
};

const getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('comments.user', 'name email role')
      .populate('history.user', 'name email role')
      .populate('relatedTickets', 'ticketNumber title status priority');

    if (!ticket) {
      return res.status(404).json({ message: req.t('ticket.notFound') });
    }

    if (req.user.role !== 'admin' && 
        ticket.createdBy._id.toString() !== req.user._id.toString() &&
        (!ticket.assignedTo || ticket.assignedTo._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: req.t('ticket.noPermissionView') });
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: req.t('ticket.getTicketError'), error: error.message });
  }
};

const createTicket = async (req, res) => {
  try {
    const { title, description, priority, category } = req.body;

    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push({
          filename: file.originalname,
          url: file.path,
          uploadedBy: req.user._id
        });
      });
    }

    const ticket = await Ticket.create({
      title,
      description,
      priority,
      category,
      createdBy: req.user._id,
      attachments,
      history: [{
        user: req.user._id,
        action: 'created',
        field: 'all',
        oldValue: '',
        newValue: 'Ticket creado'
      }]
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('createdBy', 'name email');

    res.status(201).json(populatedTicket);
  } catch (error) {
    res.status(500).json({ message: req.t('ticket.createError'), error: error.message });
  }
};

const updateTicket = async (req, res) => {
  try {
    let ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: req.t('ticket.notFound') });
    }

    if (req.user.role !== 'admin' && ticket.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: req.t('ticket.noPermissionUpdate') });
    }

    const { title, description, priority, category, status } = req.body;
    
    const oldStatus = ticket.status;
    
    const changes = [];
    if (title && title !== ticket.title) {
      changes.push({ field: 'title', oldValue: ticket.title, newValue: title });
      ticket.title = title;
    }
    if (description && description !== ticket.description) {
      changes.push({ field: 'description', oldValue: '...', newValue: '...' });
      ticket.description = description;
    }
    if (priority && priority !== ticket.priority) {
      changes.push({ field: 'priority', oldValue: ticket.priority, newValue: priority });
      ticket.priority = priority;
    }
    if (category && category !== ticket.category) {
      changes.push({ field: 'category', oldValue: ticket.category, newValue: category });
      ticket.category = category;
    }
    if (status && status !== ticket.status) {
      changes.push({ field: 'status', oldValue: ticket.status, newValue: status });
      ticket.status = status;
    }

    if (status && ['cerrado', 'resuelto'].includes(status)) {
      ticket.closedAt = new Date();
    } else if (status) {
      ticket.closedAt = null;
    }

    if (changes.length > 0) {
      changes.forEach(change => {
        ticket.history.push({
          user: req.user._id,
          action: 'updated',
          field: change.field,
          oldValue: change.oldValue,
          newValue: change.newValue
        });
      });
      await ticket.save();
    }

    ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email role')
      .populate('history.user', 'name email role')
      .populate('relatedTickets', 'ticketNumber title status priority');

    if (status && status !== oldStatus) {
      await notifyUsers(
        ticket, 
        `El estado del ticket "${ticket.title}" cambió a ${status}`, 
        'status_change', 
        req.user._id.toString()
      );
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: req.t('ticket.updateError'), error: error.message });
  }
};

const assignTicket = async (req, res) => {
  try {
    const { assignedTo } = req.body;

    let ticket = await Ticket.findById(req.params.id).populate('assignedTo', 'name');

    if (!ticket) {
      return res.status(404).json({ message: req.t('ticket.notFound') });
    }

    if (req.user.role !== 'admin' && ticket.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: req.t('ticket.noPermissionAssign') });
    }

    const oldAssignedId = ticket.assignedTo ? ticket.assignedTo._id.toString() : null;
    const oldAssignedName = ticket.assignedTo ? ticket.assignedTo.name : 'Sin asignar';

    ticket.assignedTo = assignedTo || null;
    ticket.status = assignedTo ? 'en_progreso' : 'abierto';
    
    ticket.history.push({
      user: req.user._id,
      action: 'assigned',
      field: 'assignedTo',
      oldValue: oldAssignedName,
      newValue: assignedTo ? 'Usuario Asignado' : 'Sin asignar'
    });

    await ticket.save();

    ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email role')
      .populate('history.user', 'name email role')
      .populate('relatedTickets', 'ticketNumber title status priority');

    const newAssignedName = ticket.assignedTo ? ticket.assignedTo.name : 'Sin asignar';

    if (assignedTo !== oldAssignedId) {
      const message = oldAssignedId 
        ? `Responsable cambiado de ${oldAssignedName} a ${newAssignedName} en el ticket "${ticket.title}"`
        : `El ticket "${ticket.title}" ha sido asignado a ${newAssignedName}`;

      await notifyUsers(ticket, message, 'assignment', req.user._id.toString(), [oldAssignedId]);
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: req.t('ticket.assignError'), error: error.message });
  }
};

const changeStatus = async (req, res) => {
  try {
    const { status } = req.body;

    let ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: req.t('ticket.notFound') });
    }

    if (req.user.role !== 'admin' && 
        (!ticket.assignedTo || ticket.assignedTo.toString() !== req.user._id.toString()) &&
        ticket.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: req.t('ticket.noPermissionStatus') });
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    
    if (['cerrado', 'resuelto'].includes(status)) {
      ticket.closedAt = new Date();
    } else {
      ticket.closedAt = null;
    }

    if (status !== oldStatus) {
      ticket.history.push({
        user: req.user._id,
        action: 'status_change',
        field: 'status',
        oldValue: oldStatus,
        newValue: status
      });
      await ticket.save();
    }

    ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.user', 'name email role')
      .populate('history.user', 'name email role')
      .populate('relatedTickets', 'ticketNumber title status priority');

    if (status && status !== oldStatus) {
      await notifyUsers(
        ticket, 
        `El estado del ticket "${ticket.title}" cambió a ${status}`, 
        'status_change', 
        req.user._id.toString()
      );
    }

    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: req.t('ticket.statusChangeError'), error: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: req.t('ticket.notFound') });
    }

    const attachments = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        attachments.push({
          filename: file.originalname,
          url: file.path
        });
      });
    }

    ticket.comments.push({ user: req.user._id, text, attachments });
    await ticket.save();

    const updatedTicket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('comments.user', 'name email role')
      .populate('history.user', 'name email role')
      .populate('relatedTickets', 'ticketNumber title status priority');

    await notifyUsers(
      updatedTicket, 
      `${req.user.name} comentó: "${text}"`, 
      'new_comment', 
      req.user._id.toString()
    );

    res.status(201).json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: req.t('ticket.addCommentError'), error: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const [statusStats, priorityStats, categoryStats, totalTickets, recentTickets] = await Promise.all([
      Ticket.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Ticket.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Ticket.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } }
      ]),
      Ticket.countDocuments(),
      Ticket.find()
        .populate('createdBy', 'name')
        .populate('assignedTo', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const monthlyTrend = await Ticket.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      total: totalTickets,
      byStatus: statusStats,
      byPriority: priorityStats,
      byCategory: categoryStats,
      monthlyTrend,
      recentTickets
    });
  } catch (error) {
    res.status(500).json({ message: req.t('ticket.getStatsError'), error: error.message });
  }
};

const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: req.t('ticket.notFound') });
    }

    await Notification.deleteMany({ ticket: ticket._id });

    await Ticket.findByIdAndDelete(req.params.id);

    res.json({ message: req.t('ticket.deleteSuccess') });
  } catch (error) {
    res.status(500).json({ message: req.t('ticket.deleteError'), error: error.message });
  }
};

const linkTicket = async (req, res) => {
  try {
    const { id, relatedId } = req.params;
    const mongoose = require('mongoose');

    const ticket = await Ticket.findById(id);
    let relatedTicket;
    
    if (mongoose.Types.ObjectId.isValid(relatedId)) {
      relatedTicket = await Ticket.findById(relatedId);
    } else {
      let searchNumber = relatedId.toUpperCase().trim();
      
      if (/^\d+$/.test(searchNumber)) {
        searchNumber = `TK-${searchNumber.padStart(4, '0')}`;
      } 
      else if (/^TK-\d+$/.test(searchNumber)) {
        const numPart = searchNumber.split('-')[1];
        searchNumber = `TK-${numPart.padStart(4, '0')}`;
      }

      relatedTicket = await Ticket.findOne({ ticketNumber: searchNumber });
    }

    if (!ticket || !relatedTicket) {
      return res.status(404).json({ message: req.t('ticket.linkInvalid') });
    }

    if (ticket._id.toString() === relatedTicket._id.toString()) {
      return res.status(400).json({ message: req.t('ticket.linkSelf') });
    }

    if (req.user.role !== 'admin' && ticket.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: req.t('ticket.noPermission') });
    }

    if (!ticket.relatedTickets.includes(relatedTicket._id)) {
      ticket.relatedTickets.push(relatedTicket._id);
      ticket.history.push({
        user: req.user._id,
        action: 'updated',
        field: 'relatedTickets',
        oldValue: '',
        newValue: `Vinculado al ticket ${relatedTicket.ticketNumber}`
      });
      await ticket.save();
      
      if (!relatedTicket.relatedTickets.includes(ticket._id)) {
        relatedTicket.relatedTickets.push(ticket._id);
        await relatedTicket.save();
      }
    }

    const updatedTicket = await Ticket.findById(id)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('comments.user', 'name email role')
      .populate('history.user', 'name email role')
      .populate('relatedTickets', 'ticketNumber title status priority');

    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: req.t('ticket.linkError'), error: error.message });
  }
};

const unlinkTicket = async (req, res) => {
  try {
    const { id, relatedId } = req.params;

    const ticket = await Ticket.findById(id);
    const relatedTicket = await Ticket.findById(relatedId);

    if (!ticket) {
      return res.status(404).json({ message: req.t('ticket.notFound') });
    }

    if (req.user.role !== 'admin' && ticket.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: req.t('ticket.noPermission') });
    }

    ticket.relatedTickets = ticket.relatedTickets.filter(r => r.toString() !== relatedId);
    ticket.history.push({
      user: req.user._id,
      action: 'updated',
      field: 'relatedTickets',
      oldValue: relatedTicket ? `Vinculado a ${relatedTicket.ticketNumber}` : relatedId,
      newValue: 'Vínculo removido'
    });
    await ticket.save();
    
    if (relatedTicket) {
      relatedTicket.relatedTickets = relatedTicket.relatedTickets.filter(r => r.toString() !== id);
      await relatedTicket.save();
    }

    const updatedTicket = await Ticket.findById(id)
      .populate('createdBy', 'name email role')
      .populate('assignedTo', 'name email role')
      .populate('comments.user', 'name email role')
      .populate('history.user', 'name email role')
      .populate('relatedTickets', 'ticketNumber title status priority');

    res.json(updatedTicket);
  } catch (error) {
    res.status(500).json({ message: req.t('ticket.unlinkError'), error: error.message });
  }
};

module.exports = {
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  assignTicket,
  changeStatus,
  addComment,
  getStats,
  deleteTicket,
  linkTicket,
  unlinkTicket
};
