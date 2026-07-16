import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../services/api';
import { Send, Paperclip, X } from 'lucide-react';
import { PRIORITY_LABELS, CATEGORY_LABELS } from '../utils/helpers';
import toast from 'react-hot-toast';
import './CreateTicket.css';

const CreateTicket = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', priority: 'media', category: 'otro'
  });
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('El título y la descripción son obligatorios');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('priority', form.priority);
      formData.append('category', form.category);
      
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const { data } = await ticketService.create(formData);
      toast.success(`Ticket ${data.ticketNumber} creado exitosamente`);
      navigate(`/tickets/${data._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al crear ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>

          <h1 className="page-title">Nuevo Ticket</h1>
          <p className="page-subtitle">Crea una nueva petición de soporte o mantenimiento</p>
        </div>
      </div>

      <div className="create-ticket-form-wrapper card animate-fade-in">
        <form className="create-ticket-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Título *</label>
            <input
              type="text" name="title" className="form-input"
              placeholder="Describe brevemente el problema o solicitud"
              value={form.title} onChange={handleChange} maxLength={200}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción *</label>
            <textarea
              name="description" className="form-textarea"
              placeholder="Proporciona todos los detalles relevantes..."
              value={form.description} onChange={handleChange}
              rows={6} maxLength={5000}
            />
          </div>

          <div className="create-ticket-row">
            <div className="form-group">
              <label className="form-label">Prioridad</label>
              <select name="priority" className="form-select" value={form.priority} onChange={handleChange}>
                {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select name="category" className="form-select" value={form.category} onChange={handleChange}>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label"><Paperclip size={14} style={{ marginRight: 4 }} /> Adjuntar Archivos (Opcional, Máx 5MB c/u)</label>
            <input 
              type="file" 
              multiple 
              className="form-input" 
              onChange={(e) => setAttachments(Array.from(e.target.files))}
              accept=".jpg,.jpeg,.png,.pdf,.docx,.txt,.csv"
            />
            {attachments.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {attachments.map((file, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <Paperclip size={12} /> {file.name} 
                    <button 
                      type="button" 
                      onClick={() => setAttachments(attachments.filter((_, index) => index !== i))}
                      style={{ background: 'none', border: 'none', color: 'var(--status-rejected)', cursor: 'pointer', padding: 0 }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="create-ticket-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner"></div> : <Send size={18} />}
              {loading ? 'Creando...' : 'Crear Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;
