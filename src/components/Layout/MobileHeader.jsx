import { Menu } from 'lucide-react';
import './Layout.css';
import { useNavigate } from 'react-router-dom';

const MobileHeader = ({ onMenuClick }) => {
  const navigate = useNavigate();

  return (
    <div className="mobile-header">
      <div className="mobile-header-logo" onClick={() => navigate('/')}>
        <img src="/logo.png" alt="Tickeger" className="mobile-logo-img" />
        <span className="mobile-logo-text">TICKEGER</span>
      </div>
      <button className="mobile-menu-btn" onClick={onMenuClick}>
        <Menu size={24} />
      </button>
    </div>
  );
};

export default MobileHeader;
