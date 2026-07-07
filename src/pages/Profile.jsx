import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { userService } from '../services/api';
import { User, Mail, Shield, Save } from 'lucide-react';
import { getInitials } from '../utils/helpers';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error('Nombre y email son obligatorios');
      return;
    }
    setSaving(true);
    try {
      await userService.updateProfile({ name, email });
      // Update local storage
      const stored = JSON.parse(localStorage.getItem('tickeger_user'));
      stored.name = name;
      stored.email = email;
      localStorage.setItem('tickeger_user', JSON.stringify(stored));
      toast.success('Perfil actualizado');
      window.location.reload();
    } catch (error) {
      toast.error('Error al actualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mi Perfil</h1>
          <p className="page-subtitle">Administra tu información personal</p>
        </div>
      </div>

      <div className="profile-layout animate-fade-in">
        <div className="profile-card card">
          <div className="profile-avatar-large">{getInitials(user?.name)}</div>
          <h2 className="profile-name">{user?.name}</h2>
          <p className="profile-email">{user?.email}</p>
          <span className={`badge badge-role-${user?.role}`}>
            <Shield size={10} /> {user?.role}
          </span>
        </div>

        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 20 }}>Editar Perfil</h3>
          <form className="profile-form" onSubmit={handleSave}>
            <div className="form-group">
              <label className="form-label"><User size={14} style={{ marginRight: 4 }} /> Nombre</label>
              <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label"><Mail size={14} style={{ marginRight: 4 }} /> Email</label>
              <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <div className="spinner"></div> : <Save size={16} />}
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
