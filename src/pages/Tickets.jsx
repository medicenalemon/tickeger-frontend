import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ticketService } from '../services/api';
import { Search, Filter, PlusCircle, Ticket as TicketIcon, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS, formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import './Tickets.css';

const Tickets = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filters, setFilters] = useState({ status: '', priority: '', search: '', startDate: '', endDate: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [page, filters.status, filters.priority]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      const { data } = await ticketService.getAll(params);
      setTickets(data.tickets);
      setTotal(data.total);
      setPages(data.pages);
    } catch (error) {
      toast.error('Error al cargar tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTickets();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = { export: true };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      const { data } = await ticketService.getAll(params);
      
      if (!data.tickets || data.tickets.length === 0) {
        toast.error('No hay tickets para exportar con estos filtros');
        return;
      }

      // Generate CSV
      const headers = ['Número', 'Título', 'Estado', 'Prioridad', 'Categoría', 'Creador', 'Asignado', 'Fecha de Creación'];
      const csvRows = [headers.join(',')];

      data.tickets.forEach(t => {
        const row = [
          t.ticketNumber,
          `"${(t.title || '').replace(/"/g, '""')}"`,
          STATUS_LABELS[t.status] || t.status,
          PRIORITY_LABELS[t.priority] || t.priority,
          CATEGORY_LABELS[t.category] || t.category,
          `"${(t.createdBy?.name || '').replace(/"/g, '""')}"`,
          `"${(t.assignedTo?.name || 'Sin Asignar').replace(/"/g, '""')}"`,
          formatDate(t.createdAt)
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // \uFEFF is for UTF-8 BOM
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tickets_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Tickets exportados correctamente');
    } catch (error) {
      toast.error('Error al exportar tickets');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Tickets</h1>
          <p className="page-subtitle">{total} peticiones en total</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" onClick={handleExport} disabled={exporting || tickets.length === 0}>
            {exporting ? <div className="spinner"></div> : <Download size={18} />}
            <span className="hide-on-mobile">{exporting ? 'Exportando...' : 'Exportar CSV'}</span>
          </button>
          <button className="btn btn-primary" onClick={() => navigate('/tickets/new')}>
            <PlusCircle size={18} /> <span className="hide-on-mobile">Nuevo Ticket</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="tickets-toolbar">
        <form className="tickets-search" onSubmit={handleSearch}>
          <Search size={18} className="tickets-search-icon" />
          <input
            type="text"
            className="form-input tickets-search-input"
            placeholder="Buscar por título, descripción o número..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </form>
        <button className="btn btn-secondary" onClick={() => setShowFilters(!showFilters)}>
          <Filter size={16} /> Filtros
        </button>
      </div>

      {showFilters && (
        <div className="tickets-filters animate-fade-in">
          <div className="form-group">
            <label className="form-label">Estado</label>
            <select className="form-select" value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Prioridad</label>
            <select className="form-select" value={filters.priority} onChange={(e) => handleFilterChange('priority', e.target.value)}>
              <option value="">Todas</option>
              {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Desde</label>
            <input 
              type="date" 
              className="form-input" 
              value={filters.startDate} 
              onChange={(e) => handleFilterChange('startDate', e.target.value)} 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Hasta</label>
            <input 
              type="date" 
              className="form-input" 
              value={filters.endDate} 
              onChange={(e) => handleFilterChange('endDate', e.target.value)} 
            />
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ status: '', priority: '', search: '', startDate: '', endDate: '' }); setPage(1); }}>
            Limpiar filtros
          </button>
        </div>
      )}

      {/* Tickets List */}
      {loading ? (
        <div className="loading-screen"><div className="spinner spinner-lg"></div><p>Cargando tickets...</p></div>
      ) : tickets.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><TicketIcon size={28} /></div>
          <h3>No se encontraron tickets</h3>
          <p>Crea tu primer ticket para empezar a gestionar peticiones</p>
          <button className="btn btn-primary" onClick={() => navigate('/tickets/new')}>
            <PlusCircle size={18} /> Crear Ticket
          </button>
        </div>
      ) : (
        <>
          <div className="tickets-list">
            {tickets.map((ticket, index) => (
              <div
                key={ticket._id}
                className="ticket-card animate-fade-in"
                style={{ animationDelay: `${index * 40}ms` }}
                onClick={() => navigate(`/tickets/${ticket._id}`)}
              >
                <div className="ticket-card-left">
                  <span className="ticket-card-number">{ticket.ticketNumber}</span>
                  <div className="ticket-card-content">
                    <h3 className="ticket-card-title">{ticket.title}</h3>
                    <p className="ticket-card-desc">{ticket.description}</p>
                  </div>
                </div>
                <div className="ticket-card-meta">
                  <span className={`badge badge-status-${ticket.status}`}>{STATUS_LABELS[ticket.status]}</span>
                  <span className={`badge badge-priority-${ticket.priority}`}>{PRIORITY_LABELS[ticket.priority]}</span>
                  <div className="ticket-card-info">
                    <span>Creado por: {ticket.createdBy?.name || '—'}</span>
                    <span>Asignado a: {ticket.assignedTo?.name || 'Sin asignar'}</span>
                    <span>{formatDate(ticket.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="tickets-pagination">
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={16} /> Anterior
              </button>
              <span className="pagination-info">Página {page} de {pages}</span>
              <button className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
                Siguiente <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Tickets;
