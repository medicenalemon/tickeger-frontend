import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService, userService } from '../services/api';
import {
  ArrowLeft, Send, UserCheck, Clock, Tag, Layers,
  MessageSquare, Calendar, User as UserIcon, AlertTriangle
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

  useEffect(() => {
    fetchTicket();
    fetchUsers();
  }, [id]);

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
    if (!comment.trim()) return;
    setSendingComment(true);
    try {
      const { data } = await ticketService.addComment(id, { text: comment });
      setTicket(data);
      setComment('');
      toast.success('Comentario agregado');
    } catch (error) {
      toast.error('Error al agregar comentario');
    } finally {
      setSendingComment(false);
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
            <h1 className="ticket-detail-title">{ticket.title}</h1>
            <div className="ticket-detail-badges">
              <span className={`badge badge-status-${ticket.status}`}>{STATUS_LABELS[ticket.status]}</span>
              <span className={`badge badge-priority-${ticket.priority}`}>{PRIORITY_LABELS[ticket.priority]}</span>
              <span className="badge" style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                {CATEGORY_LABELS[ticket.category]}
              </span>
            </div>
          </div>

          <div className="ticket-detail-description card">
            <p>{ticket.description}</p>
          </div>

          {/* Comments Section */}
          <div className="ticket-comments-section">
            <h3 className="ticket-section-title">
              <MessageSquare size={18} /> Comentarios ({ticket.comments?.length || 0})
            </h3>

            <div className="ticket-comments-list">
              {ticket.comments?.map((c, i) => (
                <div key={i} className="ticket-comment animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="comment-avatar">{getInitials(c.user?.name)}</div>
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-author">{c.user?.name}</span>
                      <span className="comment-time">{timeAgo(c.createdAt)}</span>
                    </div>
                    <p className="comment-text">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <form className="ticket-comment-form" onSubmit={handleComment}>
              <textarea
                className="form-textarea"
                placeholder="Escribe un comentario..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
              <button type="submit" className="btn btn-primary" disabled={sendingComment || !comment.trim()}>
                {sendingComment ? <div className="spinner"></div> : <Send size={16} />}
                Enviar
              </button>
            </form>
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

          {/* Actions */}
          {(isAdmin || ticket.assignedTo?._id === user?._id || ticket.createdBy?._id === user?._id) && (
            <div className="card ticket-actions-card">
              <h3 className="card-title" style={{ marginBottom: 16 }}>Acciones</h3>
              <div className="ticket-actions-list">
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
