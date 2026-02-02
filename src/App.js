import React, { useState } from 'react';
import './App.css';
import Home from './components/Home';
import Gallery from './components/Gallery';
import Timeline from './components/Timeline';
import LoveLetter from './components/LoveLetter';
import Memories from './components/Memories';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  
  
  const anniversaryDate = new Date('2025-02-01'); // Ejemplo: 14 de febrero 2023
  
  const renderPage = () => {
    switch(currentPage) {
      case 'home':
        return <Home setCurrentPage={setCurrentPage} anniversaryDate={anniversaryDate} />;
      case 'gallery':
        return <Gallery />;
      case 'timeline':
        return <Timeline />;
      case 'letter':
        return <LoveLetter />;
      case 'memories':
        return <Memories />;
      default:
        return <Home setCurrentPage={setCurrentPage} anniversaryDate={anniversaryDate} />;
    }
  };

  return (
    <div className="App">
      {/* Navegación Mejorada */}
      <nav className="love-navbar">
        <div className="nav-content">
          <div className="nav-brand">
            <span className="brand-heart">💖</span>
            <span className="brand-text">Nuestro 1er Año</span>
          </div>
          
          <div className="nav-links">
            <button 
              className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={() => setCurrentPage('home')}
            >
              <span className="link-icon">🏠</span>
              <span className="link-text">Inicio</span>
            </button>
            
            <button 
              className={`nav-link ${currentPage === 'gallery' ? 'active' : ''}`}
              onClick={() => setCurrentPage('gallery')}
            >
              <span className="link-icon">📸</span>
              <span className="link-text">Galería</span>
            </button>
            
            <button 
              className={`nav-link ${currentPage === 'timeline' ? 'active' : ''}`}
              onClick={() => setCurrentPage('timeline')}
            >
              <span className="link-icon">📅</span>
              <span className="link-text">Nuestra Historia</span>
            </button>
            
            <button 
              className={`nav-link ${currentPage === 'letter' ? 'active' : ''}`}
              onClick={() => setCurrentPage('letter')}
            >
              <span className="link-icon">💌</span>
              <span className="link-text">Carta de Amor</span>
            </button>
            
            <button 
              className={`nav-link ${currentPage === 'memories' ? 'active' : ''}`}
              onClick={() => setCurrentPage('memories')}
            >
              <span className="link-icon">🌟</span>
              <span className="link-text">Recuerdos</span>
            </button>
          </div>
        </div>
        
        {/* Línea decorativa debajo de la navegación */}
        <div className="nav-decoration">
          <div className="nav-heart">❤️</div>
          <div className="nav-line"></div>
          <div className="nav-heart">💕</div>
        </div>
      </nav>
      
      {/* Renderizar la página actual */}
      <div className="page-content">
        {renderPage()}
      </div>
      
      {/* Footer */}
      <footer className="love-footer">
        <div className="footer-content">
          <p>Hecho con 💖 para el amor de mi vida</p>
          <p className="footer-sub">Un año juntos y para siempre...</p>
        </div>
        <div className="footer-hearts">
          <span>❤️</span>
          <span>💖</span>
          <span>💕</span>
        </div>
      </footer>
    </div>
  );
  
}

// Componente de corazones flotantes
/*function HeartsEffect() {
  const [hearts, setHearts] = useState([]);
  
  useEffect(() => {
    const createHeart = () => {
      const heart = {
        id: Date.now(),
        left: Math.random() * 100,
        size: Math.random() * 20 + 10,
        duration: Math.random() * 3 + 2
      };
      setHearts(prev => [...prev.slice(-15), heart]); // Máximo 15 corazones
    };
    
    const interval = setInterval(createHeart, 800);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="hearts-container">
      {hearts.map(heart => (
        <div
          key={heart.id}
          className="heart"
          style={{
            left: `${heart.left}vw`,
            fontSize: `${heart.size}px`,
            animationDuration: `${heart.duration}s`
          }}
        >
          ❤️
        </div>
      ))}
    </div>
  );
}
*/
export default App;