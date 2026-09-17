const express = require('express');
const {
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
} = require('../controllers/ticketController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/stats', authorize('admin'), getStats);
router.route('/').get(getTickets).post(upload.array('attachments', 5), createTicket);
router.route('/:id').get(getTicket).put(updateTicket).delete(authorize('admin'), deleteTicket);
router.put('/:id/assign', assignTicket);
router.put('/:id/status', changeStatus);
router.post('/:id/comments', upload.array('attachments', 5), addComment);
router.post('/:id/related/:relatedId', linkTicket);
router.delete('/:id/related/:relatedId', unlinkTicket);

module.exports = router;
