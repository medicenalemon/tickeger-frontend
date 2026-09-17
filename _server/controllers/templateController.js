const Template = require('../models/Template');

// @desc    Get all templates
// @route   GET /api/templates
// @access  Private (Admin)
const getTemplates = async (req, res) => {
  try {
    const templates = await Template.find().sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener plantillas', error: error.message });
  }
};

// @desc    Create a template
// @route   POST /api/templates
// @access  Private (Admin)
const createTemplate = async (req, res) => {
  try {
    const { title, text } = req.body;
    const template = await Template.create({ title, text });
    res.status(201).json(template);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear plantilla', error: error.message });
  }
};

// @desc    Update a template
// @route   PUT /api/templates/:id
// @access  Private (Admin)
const updateTemplate = async (req, res) => {
  try {
    const { title, text } = req.body;
    const template = await Template.findByIdAndUpdate(
      req.params.id,
      { title, text },
      { new: true, runValidators: true }
    );
    if (!template) {
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }
    res.json(template);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar plantilla', error: error.message });
  }
};

// @desc    Delete a template
// @route   DELETE /api/templates/:id
// @access  Private (Admin)
const deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findByIdAndDelete(req.params.id);
    if (!template) {
      return res.status(404).json({ message: 'Plantilla no encontrada' });
    }
    res.json({ message: 'Plantilla eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar plantilla', error: error.message });
  }
};

module.exports = {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
