import { Mail, GitBranch, Briefcase, Globe, Code } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './About.css';

const About = () => {
  const { t } = useTranslation();
  return (
    <div className="page-container about-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('about.title')}</h1>
          <p className="page-subtitle">{t('about.subtitle')}</p>
        </div>
      </div>

      <div className="about-content">
        <div className="about-card card">
          <div className="about-brand">
            <div className="about-logo-container">
              <img src="/logo-red.png" alt="Tickeger Logo" className="about-logo-img" />
              <h2 className="about-brand-text">TICKEGER</h2>
            </div>
            <p className="about-version">{t('about.version')}</p>
          </div>
          
          <div className="about-divider"></div>

          <div className="about-developer-info">
            <div className="developer-header">
              <h3>Mauricio Alejandro Montero</h3>
              <p className="developer-role">{t('about.role')}</p>
              <p className="developer-copyright" style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>{t('about.copyright')}</p>
            </div>

            <div className="about-links">
              <a href="mailto:mauricioalemon1992@gmail.com" className="about-link-btn" title={t('about.contact')}>
                <Mail size={20} />
                <span>{t('about.contact')}</span>
              </a>
              <a href="https://mauriciomontero.lovable.app/" target="_blank" rel="noopener noreferrer" className="about-link-btn" title="Portfolio">
                <Globe size={20} />
                <span>Portfolio</span>
              </a>
              <a href="https://github.com/medicenalemon" target="_blank" rel="noopener noreferrer" className="about-link-btn" title="GitHub">
                <GitBranch size={20} />
                <span>GitHub</span>
              </a>
              <a href="https://www.linkedin.com/in/mauricioalemon" target="_blank" rel="noopener noreferrer" className="about-link-btn" title="LinkedIn">
                <Briefcase size={20} />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
