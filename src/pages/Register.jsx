import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Eye, EyeOff, Mail, Lock, User, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import './Auth.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('user');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      toast.error(t('auth.fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t('auth.passwordsNotMatch'));
      return;
    }
    if (password.length < 6) {
      toast.error(t('auth.passwordMinLength'));
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password, role);
      toast.success(t('auth.registerSuccess'));
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || t('auth.registerError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-decoration">
        <div className="auth-bg-circle auth-bg-circle-1"></div>
        <div className="auth-bg-circle auth-bg-circle-2"></div>
        <div className="auth-bg-circle auth-bg-circle-3"></div>
      </div>

      <div className="auth-container animate-scale-in">
        <div className="auth-header">
          <div className="auth-brand">
            <img src="/logo-red.png" alt="Tickeger" className="auth-logo-img" />
            <span className="auth-brand-text">TICKEGER</span>
          </div>
          <h1 className="auth-title">{t('auth.registerTitle')}</h1>
          <p className="auth-subtitle">{t('auth.registerSubtitle')}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('auth.fullName')}</label>
            <div className="auth-input-wrapper">
              <User size={18} className="auth-input-icon" />
              <input
                type="text"
                className="form-input auth-input"
                placeholder={t('auth.fullNamePlaceholder')}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.email')}</label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input
                type="email"
                className="form-input auth-input"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.password')}</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input auth-input"
                placeholder={t('auth.passwordMinPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="auth-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.confirmPassword')}</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input auth-input"
                placeholder={t('auth.passwordRepeatPlaceholder')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('auth.role')}</label>
            <div className="auth-input-wrapper">
              <Shield size={18} className="auth-input-icon" />
              <select
                className="form-input auth-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="user">{t('auth.roleUser')}</option>
                <option value="admin">{t('auth.roleAdmin')}</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg auth-submit"
            disabled={loading}
          >
            {loading ? <div className="spinner"></div> : <UserPlus size={20} />}
            {loading ? t('auth.registering') : t('auth.registerButton')}
          </button>
        </form>

        <div className="auth-footer">
          <p>{t('auth.hasAccount')} <Link to="/login" className="auth-link">{t('auth.loginLink')}</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
