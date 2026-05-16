import { Routes, Route, Link, useLocation } from 'react-router-dom';
import StudentView from './pages/StudentView';
import TeacherDashboard from './pages/TeacherDashboard';
import './index.css';

function App() {
  const location = useLocation();

  return (
    <>
      <nav style={{ 
        position: 'fixed', 
        bottom: '20px', 
        left: '50%', 
        transform: 'translateX(-50%)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        padding: '10px 20px',
        borderRadius: '30px',
        display: 'flex',
        gap: '20px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        zIndex: 1000,
        border: '1px solid var(--glass-border)'
      }}>
        <Link 
          to="/" 
          style={{ 
            color: location.pathname === '/' ? 'var(--accent)' : 'var(--text-secondary)',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            padding: '5px 10px',
            borderRadius: '15px',
            background: location.pathname === '/' ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
          }}
        >
          Öğrenci Arayüzü (Demo)
        </Link>
        <Link 
          to="/teacher" 
          style={{ 
            color: location.pathname === '/teacher' ? '#10b981' : 'var(--text-secondary)',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.9rem',
            padding: '5px 10px',
            borderRadius: '15px',
            background: location.pathname === '/teacher' ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
          }}
        >
          Eğitmen Komuta Merkezi (NovaVision)
        </Link>
      </nav>

      <Routes>
        <Route path="/" element={<StudentView />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
      </Routes>
    </>
  );
}

export default App;
