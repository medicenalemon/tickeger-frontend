import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService, userService, templateService } from '../services/api';
import {
  ArrowLeft, Send, UserCheck, Clock, Tag, Layers,
  MessageSquare, Calendar, User as UserIcon, AlertTriangle,
  Pencil, X, Save, Trash2, History, Activity, Paperclip, Download, Link2, Unlink
} from 'lucide-react';
import { STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS, formatDateTime, timeAgo, getInitials } from '../utils/helpers';
import toast from 'react-hot-toast';
import './TicketDetail.css';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [users, setUsers] = useState([]);
  const [showAssign, setShowAssign] = useState(false);
  const [showStatusChange, setShowStatusChange] = useState(false);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', priority: '', category: '' });
  const [saving, setSaving] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState('comments');

  // Related tickets
  const [showLinkTicket, setShowLinkTicket] = useState(false);
  const [linkTicketId, setLinkTicketId] = useState('');
  const [linking, setLinking] = useState(false);

  // Templates
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);

  // Comment attachments
  const [commentAttachments, setCommentAttachments] = useState([]);

  useEffect(() => {
    fetchTicket();
    fetchUsers();
    if (isAdmin) {
      fetchTemplates();
    }
  }, [id, isAdmin]);

  const fetchTicket = async () => {
    try {
      const { data } = await ticketService.getById(id);
      setTicket(data);
    } catch (error) {
      toast.error('Error al cargar ticket');
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await userService.getAll();
      setUsers(data.filter(u => u.isActive));
    } catch (error) { /* ignore */ }
  };

  const fetchTemplates = async () => {
    try {
      const { data } = await templateService.getAll();
      setTemplates(data);
    } catch (error) { /* ignore */ }
  };

  const handleAssign = async (userId) => {
    try {
      const { data } = await ticketService.assign(id, { assignedTo: userId });
      setTicket(data);
      setShowAssign(false);
      toast.success('Ticket asignado correctamente');
    } catch (error) {
      toast.error('Error al asignar ticket');
    }
  };

  const handleStatusChange = async (status) => {
    try {
      const { data } = await ticketService.changeStatus(id, { status });
      setTicket(data);
      setShowStatusChange(false);
      toast.success(`Estado cambiado a: ${STATUS_LABELS[status]}`);
    } catch (error) {
      toast.error('Error al cambiar estado');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() && commentAttachments.length === 0) return;
    setSendingComment(true);
    
    try {
      const formData = new FormData();
      formData.append('text', comment);
      
      commentAttachments.forEach((file) => {
        formData.append('attachments', file);
      });

      const { data } = await ticketService.addComment(id, formData);
      setTicket(data);
      setComment('');
      setCommentAttachments([]);
      toast.success('Comentario agregado');
    } catch (error) {
      toast.error('Error al agregar comentario');
    } finally {
      setSendingComment(false);
    }
  };

  const handleCommentFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`El archivo ${file.name} supera los 5MB`);
        return false;
      }
      return true;
    });

    if (commentAttachments.length + validFiles.length > 5) {
      toast.error('Máximo 5 archivos por comentario');
      return;
    }

    setCommentAttachments(prev => [...prev, ...validFiles]);
  };

  const removeCommentAttachment = (indexToRemove) => {
    setCommentAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // Edit handlers
  const startEditing = () => {
    setEditForm({
      title: ticket.title,
      description: ticket.description,
      priority: ticket.priority,
      category: ticket.category,
    });
    setIsEditing(true);
    setShowStatusChange(false);
    setShowAssign(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({ title: '', description: '', priority: '', category: '' });
  };

  const handleEditChange = (e) => {
    setEditForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim() || !editForm.description.trim()) {
      toast.error('El título y la descripción son obligatorios');
      return;
    }
    setSaving(true);
    try {
      const { data } = await ticketService.update(id, editForm);
      setTicket(data);
      setIsEditing(false);
      toast.success('Ticket actualizado correctamente');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al actualizar ticket');
    } finally {
      setSaving(false);
    }
  };

  const canEdit = isAdmin || ticket?.createdBy?._id === user?._id;

  // Delete handler
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await ticketService.delete(id);
      toast.success('Ticket eliminado correctamente');
      navigate('/tickets');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al eliminar ticket');
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleLinkTicket = async (e) => {
    e.preventDefault();
    if (!linkTicketId.trim()) return;
    setLinking(true);
    try {
      const { data } = await ticketService.linkRelated(ticket._id, linkTicketId);
      setTicket(data);
      setShowLinkTicket(false);
      setLinkTicketId('');
      toast.success('Ticket vinculado correctamente');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al vincular ticket');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkTicket = async (relatedId) => {
    try {
      const { data } = await ticketService.unlinkRelated(ticket._id, relatedId);
      setTicket(data);
      toast.success('Ticket desvinculado');
    } catch (error) {
      toast.error('Error al desvincular ticket');
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-screen"><div className="spinner spinner-lg"></div><p>Cargando ticket...</p></div>
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="page-container">
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tickets')} style={{ marginBottom: 16 }}>
        <ArrowLeft size={16} /> Volver a Tickets
      </button>

      <div className="ticket-detail-layout animate-fade-in">
        {/* Main Content */}
        <div className="ticket-detail-main">
          <div className="ticket-detail-header">
            <span className="ticket-detail-number">{ticket.ticketNumber}</span>

            {isEditing ? (
              <div className="ticket-edit-section animate-fade-in">
                <div className="form-group">
                  <label className="form-label">Título *</label>
                  <input
                    type="text"
                    name="title"
                    className="form-input"
                    value={editForm.title}
                    onChange={handleEditChange}
                    maxLength={200}
                    placeholder="Título del ticket"
                    autoFocus
                  />
                </div>
              </div>
            ) : (
              <h1 className="ticket-detail-title">{ticket.title}</h1>
            )}

            {!isEditing && (
              <div className="ticket-detail-badges">
                <span className={`badge badge-status-${ticket.status}`}>{STATUS_LABELS[ticket.status]}</span>
                <span className={`badge badge-priority-${ticket.priority}`}>{PRIORITY_LABELS[ticket.priority]}</span>
                <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                  {CATEGORY_LABELS[ticket.category]}
                </span>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="ticket-edit-section animate-fade-in">
              <div className="form-group">
                <label className="form-label">Descripción *</label>
                <textarea
                  name="description"
                  className="form-textarea"
                  value={editForm.description}
                  onChange={handleEditChange}
                  rows={6}
                  maxLength={5000}
                  placeholder="Descripción del ticket"
                />
              </div>

              <div className="ticket-edit-row">
                <div className="form-group">
                  <label className="form-label">Prioridad</label>
                  <select name="priority" className="form-select" value={editForm.priority} onChange={handleEditChange}>
                    {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Categoría</label>
                  <select name="category" className="form-select" value={editForm.category} onChange={handleEditChange}>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ticket-edit-actions">
                <button type="button" className="btn btn-ghost" onClick={cancelEditing} disabled={saving}>
                  <X size={16} /> Cancelar
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveEdit} disabled={saving}>
                  {saving ? <div className="spinner"></div> : <Save size={16} />}
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          ) : (
            <div className="ticket-detail-description card">
              <p>{ticket.description}</p>
              
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="ticket-attachments">
                  <h4 className="attachments-title"><Paperclip size={16} /> Archivos Adjuntos</h4>
                  <div className="attachments-list">
                    {ticket.attachments.map((file, i) => (
                      <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" className="attachment-item">
                        <span className="attachment-name">{file.filename}</span>
                        <Download size={14} className="attachment-download-icon" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabs: Comments & History */}
          <div className="ticket-tabs">
            <button 
              className={`ticket-tab ${activeTab === 'comments' ? 'active' : ''}`}
              onClick={() => setActiveTab('comments')}
            >
              <MessageSquare size={16} /> Comentarios ({ticket.comments?.length || 0})
            </button>
            <button 
              className={`ticket-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <History size={16} /> Historial
            </button>
          </div>

          <div className="ticket-tab-content">
            {activeTab === 'comments' && (
              <div className="ticket-comments-section animate-fade-in">
                <div className="ticket-comments-list">
                  {ticket.comments?.map((c, i) => (
                    <div key={i} className="ticket-comment" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="comment-avatar">{getInitials(c.user?.name)}</div>
                      <div className="comment-content">
                        <div className="comment-header">
                          <span className="comment-author">{c.user?.name}</span>
                          <span className="comment-time">{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="comment-text">{c.text}</p>
                        
                        {c.attachments && c.attachments.length > 0 && (
                          <div className="ticket-attachments" style={{ marginTop: '8px' }}>
                            <div className="attachments-list">
                              {c.attachments.map((file, idx) => (
                                <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="attachment-item">
                                  <span className="attachment-name">{file.filename}</span>
                                  <Download size={14} className="attachment-download-icon" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {!ticket.comments?.length && (
                    <div className="empty-state-small">No hay comentarios aún.</div>
                  )}
                </div>

                <form className="ticket-comment-form" onSubmit={handleComment}>
                  <div style={{ position: 'relative', flex: 1, width: '100%' }}>
                    <textarea
                      className="form-textarea"
                      placeholder="Escribe un comentario..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      style={{ paddingRight: isAdmin && templates.length > 0 ? '40px' : '12px' }}
                    />
                    {isAdmin && templates.length > 0 && (
                      <div style={{ position: 'absolute', right: '8px', top: '8px' }}>
                        <button 
                          type="button" 
                          className="btn btn-ghost btn-sm"
                          onClick={() => setShowTemplates(!showTemplates)}
                          title="Insertar Plantilla"
                          style={{ padding: '4px' }}
                        >
                          <MessageSquare size={16} />
                        </button>
                        {showTemplates && (
                          <div className="ticket-dropdown animate-scale-in" style={{ right: 0, left: 'auto', minWidth: '200px', top: '30px' }}>
                            {templates.map(t => (
                              <button 
                                key={t._id} 
                                type="button"
                                className="ticket-dropdown-item"
                                onClick={() => {
                                  setComment(prev => prev ? `${prev}\n\n${t.text}` : t.text);
                                  setShowTemplates(false);
                                }}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
                              >
                                <span style={{ fontWeight: 600, fontSize: '13px' }}>{t.title}</span>
                                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'left' }}>{t.text}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {commentAttachments.length > 0 && (
                    <div className="comment-attachments-preview" style={{ width: '100%', display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                      {commentAttachments.map((file, i) => (
                        <div key={i} className="attachment-preview-badge">
                          <span className="attachment-preview-name">{file.name}</span>
                          <button type="button" onClick={() => removeCommentAttachment(i)} className="attachment-preview-remove">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '8px' }}>
                    <div className="comment-actions-left">
                      <input 
                        type="file" 
                        id="comment-attachments" 
                        multiple 
                        onChange={handleCommentFileChange} 
                        style={{ display: 'none' }} 
                        accept=".jpg,.jpeg,.png,.pdf,.docx,.txt,.csv"
                      />
                      <label htmlFor="comment-attachments" className="btn btn-ghost btn-sm" style={{ cursor: 'pointer', padding: '4px 8px' }}>
                        <Paperclip size={16} style={{ marginRight: '4px' }}/> Adjuntar
                      </label>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={sendingComment || (!comment.trim() && commentAttachments.length === 0)}>
                      {sendingComment ? <div className="spinner"></div> : <Send size={16} />}
                      Enviar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="ticket-history-section animate-fade-in">
                <div className="ticket-history-list">
                  {ticket.history?.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((h, i) => (
                    <div key={i} className="ticket-history-item">
                      <div className="history-icon">
                        <Activity size={14} />
                      </div>
                      <div className="history-content">
                        <p className="history-text">
                          <strong>{h.user?.name}</strong> {
                            h.action === 'created' ? 'creó el ticket' :
                            h.action === 'assigned' ? `asignó el ticket a ${h.newValue}` :
                            h.action === 'status_change' ? `cambió el estado a ${STATUS_LABELS[h.newValue] || h.newValue}` :
                            `actualizó ${h.field}: ${h.newValue || '...'}`
                          }
                        </p>
                        <span className="history-time">{formatDateTime(h.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                  {!ticket.history?.length && (
                    <div className="empty-state-small">No hay historial disponible.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="ticket-detail-sidebar">
          {/* Info Card */}
          <div className="card ticket-info-card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>Información</h3>
            <div className="ticket-info-list">
              <div className="ticket-info-item">
                <UserIcon size={14} />
                <span className="ticket-info-label">Creado por</span>
                <span className="ticket-info-value">{ticket.createdBy?.name}</span>
              </div>
              <div className="ticket-info-item">
                <UserCheck size={14} />
                <span className="ticket-info-label">Asignado a</span>
                <span className="ticket-info-value">{ticket.assignedTo?.name || 'Sin asignar'}</span>
              </div>
              <div className="ticket-info-item">
                <Calendar size={14} />
                <span className="ticket-info-label">Creado</span>
                <span className="ticket-info-value">{formatDateTime(ticket.createdAt)}</span>
              </div>
              <div className="ticket-info-item">
                <Clock size={14} />
                <span className="ticket-info-label">Actualizado</span>
                <span className="ticket-info-value">{formatDateTime(ticket.updatedAt)}</span>
              </div>
              {ticket.closedAt && (
                <div className="ticket-info-item">
                  <Tag size={14} />
                  <span className="ticket-info-label">Cerrado</span>
                  <span className="ticket-info-value">{formatDateTime(ticket.closedAt)}</span>
                </div>
              )}
              <div className="ticket-info-item">
                <Layers size={14} />
                <span className="ticket-info-label">Categoría</span>
                <span className="ticket-info-value">{CATEGORY_LABELS[ticket.category]}</span>
              </div>
              <div className="ticket-info-item">
                <AlertTriangle size={14} />
                <span className="ticket-info-label">Prioridad</span>
                <span className={`badge badge-priority-${ticket.priority}`}>{PRIORITY_LABELS[ticket.priority]}</span>
              </div>
            </div>
          </div>

          {/* Related Tickets */}
          <div className="card ticket-info-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className="card-title" style={{ margin: 0 }}>Tickets Relacionados</h3>
              {canEdit && (
                <button className="btn btn-ghost btn-sm" onClick={() => setShowLinkTicket(!showLinkTicket)}>
                  <Link2 size={14} /> Vincular
                </button>
              )}
            </div>
            
            {showLinkTicket && (
              <form onSubmit={handleLinkTicket} style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  style={{ flex: 1, padding: '4px 8px', fontSize: '13px' }}
                  placeholder="ID del Ticket..." 
                  value={linkTicketId}
                  onChange={e => setLinkTicketId(e.target.value)}
                />
                <button type="submit" className="btn btn-primary btn-sm" disabled={linking || !linkTicketId}>
                  {linking ? <div className="spinner"></div> : 'OK'}
                </button>
              </form>
            )}

            {ticket.relatedTickets && ticket.relatedTickets.length > 0 ? (
              <div className="ticket-related-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ticket.relatedTickets.map(related => (
                  <div key={related._id} className="ticket-related-item" style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '8px', background: 'var(--bg-body)', borderRadius: '4px', border: '1px solid var(--border-primary)' 
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }} onClick={() => navigate(`/tickets/${related._id}`)}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)' }}>{related.ticketNumber}</span>
                      <span style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>{related.title}</span>
                    </div>
                    {canEdit && (
                      <button className="btn btn-ghost" style={{ padding: '4px', color: 'var(--status-rejected)' }} onClick={() => handleUnlinkTicket(related._id)}>
                        <Unlink size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state-small" style={{ padding: '16px' }}>Ninguno</div>
            )}
          </div>

          {/* Actions */}
          {(isAdmin || ticket.assignedTo?._id === user?._id || ticket.createdBy?._id === user?._id) && (
            <div className="card ticket-actions-card">
              <h3 className="card-title" style={{ marginBottom: 16 }}>Acciones</h3>
              <div className="ticket-actions-list">
                {/* Edit Button */}
                {canEdit && !isEditing && (
                  <button className="btn btn-edit" style={{ width: '100%' }} onClick={startEditing}>
                    <Pencil size={16} /> Editar Ticket
                  </button>
                )}

                <div style={{ position: 'relative' }}>
                  <button className="btn btn-secondary" style={{ width: '100%' }}
                    onClick={() => { setShowStatusChange(!showStatusChange); setShowAssign(false); }}>
                    Cambiar Estado
                  </button>
                  {showStatusChange && (
                    <div className="ticket-dropdown animate-scale-in">
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <button key={k} className={`ticket-dropdown-item ${ticket.status === k ? 'active' : ''}`}
                          onClick={() => handleStatusChange(k)} disabled={ticket.status === k}>
                          <span className={`badge badge-status-${k}`}>{v}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {(isAdmin || ticket.createdBy?._id === user?._id) && (
                  <div style={{ position: 'relative' }}>
                    <button className="btn btn-secondary" style={{ width: '100%' }}
                      onClick={() => { setShowAssign(!showAssign); setShowStatusChange(false); }}>
                      <UserCheck size={16} /> Asignar
                    </button>
                    {showAssign && (
                      <div className="ticket-dropdown animate-scale-in">
                        <button className="ticket-dropdown-item" onClick={() => handleAssign(null)}>
                          Sin asignar
                        </button>
                        {users.map(u => (
                          <button key={u._id} className={`ticket-dropdown-item ${ticket.assignedTo?._id === u._id ? 'active' : ''}`}
                            onClick={() => handleAssign(u._id)}>
                            {u.name} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({u.role})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Delete Button - Admin only */}
                {isAdmin && (
                  <button className="btn btn-delete" style={{ width: '100%' }}
                    onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 size={16} /> Eliminar Ticket
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="modal-overlay animate-fade-in" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal-delete animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-delete-icon">
              <Trash2 size={32} />
            </div>
            <h3 className="modal-delete-title">¿Eliminar este ticket?</h3>
            <p className="modal-delete-text">
              Estás a punto de eliminar el ticket <strong>{ticket.ticketNumber}</strong>: "{ticket.title}". 
              Esta acción no se puede deshacer y se eliminarán todos los comentarios y notificaciones asociadas.
            </p>
            <div className="modal-delete-actions">
              <button className="btn btn-secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deleting}>
                Cancelar
              </button>
              <button className="btn btn-delete" onClick={handleDelete} disabled={deleting}>
                {deleting ? <div className="spinner"></div> : <Trash2 size={16} />}
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetail;
