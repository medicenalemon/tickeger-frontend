const express = require('express');
const { getUsers, getUser, updateUser, deleteUser, updateProfile, updatePassword } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.put('/profile', updateProfile);
router.put('/profile/password', updatePassword);
router.route('/').get(getUsers);
router.route('/:id')
  .get(authorize('admin'), getUser)
  .put(authorize('admin'), updateUser)
  .delete(authorize('admin'), deleteUser);

module.exports = router;
