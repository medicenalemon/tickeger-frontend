import { Mail, GitBranch, Briefcase, Globe, Code } from 'lucide-react';
import './About.css';

const About = () => {
  return (
    <div className="page-container about-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Acerca de</h1>
          <p className="page-subtitle">Información del sistema y el desarrollador</p>
        </div>
      </div>

      <div className="about-content">
        <div className="about-card card">
          <div className="about-brand">
            <img src="/logo.png" alt="Tickeger Logo" className="about-logo-img" />
            <h2 className="about-brand-text">TICKEGER</h2>
            <p className="about-version">Versión 2.0</p>
          </div>
          
          <div className="about-divider"></div>

          <div className="about-developer-info">
            <div className="developer-header">
              <h3>Mauricio Alejandro Montero</h3>
              <p className="developer-role">Ingeniero en Sistemas de Información / Desarrollador Web Full-Stack</p>
            </div>

            <div className="tech-stack">
              <h4><Code size={16} /> Stack Tecnológico</h4>
              <div className="stack-badges">
                <span className="badge badge-tech">React</span>
                <span className="badge badge-tech">Vite</span>
                <span className="badge badge-tech">Node.js</span>
                <span className="badge badge-tech">Express</span>
                <span className="badge badge-tech">MongoDB</span>
              </div>
            </div>

            <div className="about-links">
              <a href="mailto:mauricioalemon1992@gmail.com" className="about-link-btn" title="Correo Electrónico">
                <Mail size={20} />
                <span>Contacto</span>
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
