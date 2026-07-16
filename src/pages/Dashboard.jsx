import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
  Ticket, Clock, CheckCircle2, AlertTriangle, TrendingUp,
  ArrowUpRight, BarChart3, Activity
} from 'lucide-react';
import { STATUS_LABELS, PRIORITY_LABELS, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import './Dashboard.css';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      if (isAdmin) {
        const { data } = await ticketService.getStats();
        setStats(data);
      } else {
        // Regular users - fetch their tickets to build stats
        const { data } = await ticketService.getAll({ limit: 100 });
        const byStatus = {};
        const byPriority = {};
        data.tickets.forEach(t => {
          byStatus[t.status] = (byStatus[t.status] || 0) + 1;
          byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
        });
        setStats({
          total: data.total,
          byStatus: Object.entries(byStatus).map(([k, v]) => ({ _id: k, count: v })),
          byPriority: Object.entries(byPriority).map(([k, v]) => ({ _id: k, count: v })),
          byCategory: [],
          recentTickets: data.tickets.slice(0, 5),
          monthlyTrend: []
        });
      }
    } catch (error) {
      toast.error('Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const getStatusCount = (status) => {
    if (!stats?.byStatus) return 0;
    const found = stats.byStatus.find(s => s._id === status);
    return found ? found.count : 0;
  };

  const getPriorityCount = (priority) => {
    if (!stats?.byPriority) return 0;
    const found = stats.byPriority.find(p => p._id === priority);
    return found ? found.count : 0;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-screen">
          <div className="spinner spinner-lg"></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      label: isAdmin ? 'Total Tickets' : 'Mis Tickets',
      value: stats?.total || 0,
      icon: Ticket,
      color: 'var(--color-primary)',
      bg: 'var(--color-primary-lighter)',
    },
    {
      label: 'Abiertos',
      value: getStatusCount('abierto'),
      icon: Clock,
      color: 'var(--status-open)',
      bg: 'var(--status-open-bg)',
    },
    {
      label: 'En Progreso',
      value: getStatusCount('en_progreso'),
      icon: Activity,
      color: 'var(--status-in-progress)',
      bg: 'var(--status-in-progress-bg)',
    },
    {
      label: 'Resueltos',
      value: getStatusCount('resuelto'),
      icon: CheckCircle2,
      color: 'var(--status-resolved)',
      bg: 'var(--status-resolved-bg)',
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Bienvenido, {user?.name} — {isAdmin ? 'Vista de Administrador' : 'Mis Estadísticas'}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-summary">
        {summaryCards.map((card, index) => (
          <div
            key={card.label}
            className="dashboard-stat-card animate-fade-in"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="stat-card-icon" style={{ background: card.bg, color: card.color }}>
              <card.icon size={22} />
            </div>
            <div className="stat-card-info">
              <span className="stat-card-value">{card.value}</span>
              <span className="stat-card-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Status Distribution */}
        <div className="card animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="card-header">
            <h3 className="card-title">
              <BarChart3 size={18} style={{ marginRight: 8, color: 'var(--color-primary)' }} />
              Distribución por Estado
            </h3>
          </div>
          <div className="status-bars">
            {Object.entries(STATUS_LABELS).map(([key, label]) => {
              const count = getStatusCount(key);
              const percentage = stats?.total ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={key} className="status-bar-item">
                  <div className="status-bar-header">
                    <span className={`badge badge-status-${key}`}>{label}</span>
                    <span className="status-bar-count">{count}</span>
                  </div>
                  <div className="status-bar-track">
                    <div
                      className={`status-bar-fill status-bar-fill-${key}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="card animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="card-header">
            <h3 className="card-title">
              <AlertTriangle size={18} style={{ marginRight: 8, color: 'var(--color-primary)' }} />
              Por Prioridad
            </h3>
          </div>
          <div className="priority-grid">
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => {
              const count = getPriorityCount(key);
              return (
                <div key={key} className="priority-item">
                  <div className={`priority-item-dot priority-dot-${key}`}></div>
                  <div className="priority-item-info">
                    <span className="priority-item-label">{label}</span>
                    <span className="priority-item-count">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="card dashboard-recent animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="card-header">
            <h3 className="card-title">
              <TrendingUp size={18} style={{ marginRight: 8, color: 'var(--color-primary)' }} />
              Tickets Recientes
            </h3>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/tickets')}>
              Ver todos <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="recent-tickets-list">
            {stats?.recentTickets?.length > 0 ? (
              stats.recentTickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="recent-ticket-item"
                  onClick={() => navigate(`/tickets/${ticket._id}`)}
                >
                  <div className="recent-ticket-header">
                    <span className="recent-ticket-number">{ticket.ticketNumber}</span>
                    <span className={`badge badge-status-${ticket.status}`}>
                      {STATUS_LABELS[ticket.status]}
                    </span>
                  </div>
                  <p className="recent-ticket-title">{ticket.title}</p>
                  <div className="recent-ticket-meta">
                    <span>{ticket.createdBy?.name || 'Usuario'}</span>
                    <span>{formatDate(ticket.createdAt)}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>No hay tickets recientes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
