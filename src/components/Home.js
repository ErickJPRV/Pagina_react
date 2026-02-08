import React, { useState, useEffect, useCallback } from 'react';

function Home({ setCurrentPage, anniversaryDate }) {
  const [timeTogether, setTimeTogether] = useState({
    years: 0,
    days: 0,
    hours: 0,
    minutes: 0
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [hearts, setHearts] = useState([]);
  const [confetti, setConfetti] = useState([]);
  const [showSpecialEffect, setShowSpecialEffect] = useState(false);
  const [nextAnniversaryData, setNextAnniversaryData] = useState({
    daysUntil: 0,
    date: null,
    progress: 0
  });

  // Crear corazones flotantes
  useEffect(() => {
    const createHeart = () => {
      const heartTypes = ['❤️', '💖', '💕', '💗', '💓', '💞', '💝'];
      const heart = {
        id: Date.now() + Math.random(),
        type: heartTypes[Math.floor(Math.random() * heartTypes.length)],
        left: Math.random() * 100,
        size: Math.random() * 25 + 20,
        duration: Math.random() * 5 + 3,
        opacity: Math.random() * 0.5 + 0.5
      };
      setHearts(prev => [...prev.slice(-20), heart]);
    };

    const heartInterval = setInterval(createHeart, 800);
    return () => clearInterval(heartInterval);
  }, []);

  // Crear confeti ocasional
  useEffect(() => {
    const createConfetti = () => {
      if (Math.random() > 0.7) {
        const confettiTypes = ['✨', '🎉', '🌟', '🎊', '💫', '⭐'];
        const piece = {
          id: Date.now() + Math.random(),
          type: confettiTypes[Math.floor(Math.random() * confettiTypes.length)],
          left: Math.random() * 100,
          size: Math.random() * 20 + 15,
          duration: Math.random() * 4 + 2,
          rotation: Math.random() * 360
        };
        setConfetti(prev => [...prev.slice(-15), piece]);
      }
    };

    const confettiInterval = setInterval(createConfetti, 1500);
    return () => clearInterval(confettiInterval);
  }, []);

  // Calcular tiempo juntos y próximo aniversario
  const calculateTimeTogether = useCallback(() => {
    const now = new Date();
    const startDate = new Date(anniversaryDate);
    
    const diff = now - startDate;
    
    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    setTimeTogether({ years, days, hours, minutes });
    
    // Calcular próximo aniversario y progreso
    calculateNextAnniversary(now, startDate, years);
    
    setIsLoading(false);

    if (minutes % 5 === 0) {
      setShowSpecialEffect(true);
      setTimeout(() => setShowSpecialEffect(false), 2000);
    }
  }, [anniversaryDate]);

  // Función para calcular próximo aniversario
  const calculateNextAnniversary = (now, startDate, yearsTogether) => {
    // Crear fecha del próximo aniversario
    const nextAnniversary = new Date(startDate);
    nextAnniversary.setFullYear(now.getFullYear());
    
    // Si ya pasó el aniversario de este año, calcular para el próximo año
    if (now > nextAnniversary) {
      nextAnniversary.setFullYear(nextAnniversary.getFullYear() + 1);
    }
    
    // Calcular días faltantes
    const diffMs = nextAnniversary - now;
    const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    // Calcular progreso hacia el próximo aniversario (0-100%)
    // El progreso se calcula desde el último aniversario hasta el próximo
    const lastAnniversary = new Date(startDate);
    lastAnniversary.setFullYear(nextAnniversary.getFullYear() - 1);
    
    const totalDaysBetween = 365; // Un año completo
    const daysSinceLastAnniversary = Math.floor((now - lastAnniversary) / (1000 * 60 * 60 * 24));
    const progress = Math.min(100, Math.round((daysSinceLastAnniversary / totalDaysBetween) * 100));
    
    setNextAnniversaryData({
      daysUntil,
      date: nextAnniversary,
      progress
    });
  };

  useEffect(() => {
    calculateTimeTogether();
    const interval = setInterval(calculateTimeTogether, 60000);
    return () => clearInterval(interval);
  }, [calculateTimeTogether]);

  // Mensajes románticos
  const romanticMessages = [
    "Cada latido de mi corazón tiene tu nombre 💓",
    "Eres mi sueño hecho realidad 🌟",
    "Contigo encontré el amor que buscaba 💖",
    "Tu sonrisa ilumina mi mundo entero ☀️",
    "Eres la razón de mi felicidad cada día 🥰",
    "Amo cada momento a tu lado 💕",
    "Eres mi persona favorita en todo el universo 🌌",
    "Mi amor por ti crece más cada día 🌹",
    "Eres el mejor regalo que la vida me dio 🎁",
    "Contigo todo es más bonito ✨"
  ];

  const getRomanticMessage = () => {
    const { days } = timeTogether;
    return romanticMessages[days % romanticMessages.length];
  };

  // Formatear fecha
  const formatStartDate = () => {
    return new Date(anniversaryDate).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formatear fecha del próximo aniversario
  const formatNextAnniversaryDate = () => {
    if (!nextAnniversaryData.date) return '';
    return nextAnniversaryData.date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="home-container">
      {/* Fondo decorativo */}
      <div className="love-background">
        {/* Corazones flotantes */}
        <div className="floating-hearts">
          {hearts.map(heart => (
            <div
              key={heart.id}
              className={`heart ${heart.explode ? 'explode' : ''}`}
              style={{
                left: `${heart.left}%`,
                fontSize: `${heart.size}px`,
                animationDuration: `${heart.duration}s`,
                opacity: heart.opacity,
                transform: heart.explode ? 'scale(1.5)' : 'scale(1)'
              }}
            >
              {heart.type}
            </div>
          ))}
        </div>

        {/* Confeti */}
        <div className="floating-confetti">
          {confetti.map(piece => (
            <div
              key={piece.id}
              className="confetti-piece"
              style={{
                left: `${piece.left}%`,
                fontSize: `${piece.size}px`,
                animationDuration: `${piece.duration}s`,
                transform: `rotate(${piece.rotation}deg)`
              }}
            >
              {piece.type}
            </div>
          ))}
        </div>

        {/* Efecto especial */}
        {showSpecialEffect && (
          <div className="special-effect">
            <div className="sparkle">✨</div>
            <div className="sparkle">🌟</div>
            <div className="sparkle">💫</div>
          </div>
        )}
      </div>

      {/* Contenido principal */}
      <div className="hero-section">
        {/* Título con efecto especial */}
        <div className="title-container">
          <h1 className="main-title">Nuestra Historia de Amor</h1>
          <p className="main-subtitle">Cada latido, cada sonrisa, cada momento contigo 💕</p>
          <div className="title-decoration"></div>
        </div>

        {/* Contador en tarjeta decorada */}
        <div className="counter-card">
          <div className="card-decoration top-left">🌸</div>
          <div className="card-decoration top-right">🌺</div>
          <div className="card-decoration bottom-left">🌼</div>
          <div className="card-decoration bottom-right">🌷</div>
          
          <div className="counter-header">
            <h2 className="counter-title">
              <span className="heart-icon">👨‍❤️‍💋‍👨</span>
              Tiempo Juntos
              <span className="heart-icon">👨‍❤️‍👨</span>
            </h2>
            <p className="counter-subtitle">Desde que nuestros corazones se encontraron</p>
          </div>
          
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-hearts">
                <span>💗</span>
                <span>💖</span>
                <span>💕</span>
              </div>
              <p>Cargando nuestro amor...</p>
            </div>
          ) : (
            <>
              <div className="romantic-counter">
                <div className="counter-unit">
                  <div className="unit-value animate-bounce">{timeTogether.years}</div>
                  <div className="unit-label">Año{timeTogether.years !== 1 ? 's' : ''}</div>
                  <div className="unit-decoration">📅</div>
                </div>
                
                <div className="counter-unit">
                  <div className="unit-value animate-bounce">{timeTogether.days % 365}</div>
                  <div className="unit-label">Día{(timeTogether.days % 365) !== 1 ? 's' : ''}</div>
                  <div className="unit-decoration">🌞</div>
                </div>
                
                <div className="counter-unit">
                  <div className="unit-value animate-bounce">{timeTogether.hours}</div>
                  <div className="unit-label">Hora{timeTogether.hours !== 1 ? 's' : ''}</div>
                  <div className="unit-decoration">⏰</div>
                </div>
                
                <div className="counter-unit">
                  <div className="unit-value animate-bounce">{timeTogether.minutes}</div>
                  <div className="unit-label">Minuto{timeTogether.minutes !== 1 ? 's' : ''}</div>
                  <div className="unit-decoration">⏳</div>
                </div>
              </div>
              
              {/* Mensaje del día */}
              <div className="daily-message">
                <div className="message-bubble">
                  <div className="bubble-decoration">💬</div>
                  <p className="message-text">{getRomanticMessage()}</p>
                  <div className="bubble-tail"></div>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Panel de información */}
        <div className="info-panel">
          {/* Fecha de inicio */}
          <div className="info-box start-date-box">
            <div className="box-icon">📅</div>
            <div className="box-content">
              <h3>Nuestro Comienzo</h3>
              <p className="highlight-date">Sabado, 01 de febrero del 2025</p>
              <p className="box-detail">El día más especial de mi vida</p>
            </div>
            <div className="box-decoration">🎀</div>
          </div>
          
          {/* Contador regresivo - AHORA SIEMPRE VISIBLE */}
          <div className="info-box countdown-box">
            <div className="box-icon">🎂</div>
            <div className="box-content">
              <h3>Próximo Aniversario</h3>
              {nextAnniversaryData.daysUntil === 0 ? (
                <div className="countdown-display today">
                  <span className="countdown-number">¡HOY!</span>
                  <span className="countdown-text">🎉 ¡Feliz Aniversario! 🎉</span>
                </div>
              ) : (
                <>
                  <div className="countdown-display">
                    <span className="countdown-number">{nextAnniversaryData.daysUntil}</span>
                    <span className="countdown-text">días</span>
                  </div>
                  <p className="anniversary-date">
                    {formatNextAnniversaryDate()}
                  </p>
                </>
              )}
              
              <div className="progress-wrapper">
                <div className="love-progress">
                  <div 
                    className="progress-fill"
                    style={{ width: `${nextAnniversaryData.progress}%` }}
                  >
                    {nextAnniversaryData.progress > 10 && (
                      <span className="progress-percent">
                        {nextAnniversaryData.progress}%
                      </span>
                    )}
                  </div>
                </div>
                <p className="progress-label">
                  {nextAnniversaryData.progress}% hacia nuestro próximo aniversario
                </p>
              </div>
            </div>
            <div className="box-decoration">🎊</div>
          </div>
        </div>
        
        {/* Botones decorados */}
        <div className="action-section">
          <div className="section-title">
            <h3>Descubre Nuestro Amor</h3>
            <div className="title-line"></div>
          </div>
          
          <div className="action-grid">
            <button 
              className="action-card gallery-card"
              onClick={() => setCurrentPage('gallery')}
            >
              <div className="card-icon">📸</div>
              <div className="card-content">
                <h4>Nuestra Galería</h4>
                <p>Momentos capturados para siempre</p>
              </div>
              <div className="card-arrow">→</div>
            </button>
            
            <button 
              className="action-card letter-card"
              onClick={() => setCurrentPage('letter')}
            >
              <div className="card-icon">💌</div>
              <div className="card-content">
                <h4>Cartas de Amor</h4>
                <p>Palabras desde el corazón</p>
              </div>
              <div className="card-arrow">→</div>
            </button>
            
            <button 
              className="action-card memories-card"
              onClick={() => setCurrentPage('memories')}
            >
              <div className="card-icon">🌟</div>
              <div className="card-content">
                <h4>Recuerdos</h4>
                <p>Aventuras y risas compartidas</p>
              </div>
              <div className="card-arrow">→</div>
            </button>
          </div>
        </div>
        
        {/* Mensaje final */}
        <div className="final-message">
          <div className="message-frame">
            <div className="frame-corner tl">💝</div>
            <div className="frame-corner tr">💝</div>
            <div className="frame-corner bl">💝</div>
            <div className="frame-corner br">💝</div>
            
            <div className="message-core">
              <p className="love-quote">
                "Esta página fue creada con todo el amor de mi corazón para celebrar 
                cada instante a tu lado. Eres mi todo, mi razón, mi felicidad. 
                Te amo más de lo que las palabras pueden expresar."
              </p>
              <div className="signature">
                <span className="signature-line"></span>
                <span className="signature-text">Con todo mi amor</span>
                <span className="signature-heart">💖</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;