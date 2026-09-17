const express = require('express');
const { getTemplates, createTemplate, updateTemplate, deleteTemplate } = require('../controllers/templateController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getTemplates)
  .post(createTemplate);

router.route('/:id')
  .put(updateTemplate)
  .delete(deleteTemplate);

module.exports = router;
