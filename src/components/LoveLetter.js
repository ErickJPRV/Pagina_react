import React, { useState, useEffect, useRef, useCallback } from 'react'; // Añadido useCallback
import { supabase } from '../supabase';
import './LoveLetter.css';
import { useBackgroundAnimation } from './BackgroundAnimations';
const LoveLetter = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFD6E0');
  const [selectedStyle, setSelectedStyle] = useState('heart');
  const [showForm, setShowForm] = useState(false);
  const [authorName, setAuthorName] = useState('Yo');
  const [filter, setFilter] = useState('all');
  const [secretCode, setSecretCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const wallRef = useRef(null);
  const { Background } = useBackgroundAnimation('letter');
  const APP_SECRET_CODE = 'AMOR2024';

  const colorOptions = [
    { name: 'Rosa', value: '#FFD6E0' },
    { name: 'Amarillo', value: '#FFF9C4' },
    { name: 'Azul', value: '#E3F2FD' },
    { name: 'Verde', value: '#E8F5E9' },
    { name: 'Morado', value: '#F3E5F5' },
    { name: 'Coral', value: '#FFE0B2' },
  ];

  const styleOptions = [
    { name: 'Corazón', value: 'heart', icon: '❤️' },
    { name: 'Estrella', value: 'star', icon: '⭐' },
    { name: 'Flor', value: 'flower', icon: '🌸' },
    { name: 'Nube', value: 'cloud', icon: '☁️' },
    { name: 'Clásico', value: 'classic', icon: '📝' },
    { name: 'Sorpresa', value: 'surprise', icon: '🎁' },
  ];
  const fetchMessages = useCallback(async (code) => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('love_messages')
        .select('*')
        .eq('secret_code', code)
        .order('created_at', { ascending: false });

      if (filter === 'pinned') {
        query = query.eq('is_pinned', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      const messagesWithPositions = data.map(msg => ({
        ...msg,
        position_x: msg.position_x || Math.random() * 80,
        position_y: msg.position_y || Math.random() * 60,
        rotation: msg.rotation || Math.random() * 10 - 5
      }));

      setMessages(messagesWithPositions);
    } catch (error) {
      console.error('Error:', error);
      setMessages(getSampleMessages());
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    const savedCode = localStorage.getItem('love_code');
    const savedName = localStorage.getItem('love_author');
    
    if (savedCode === APP_SECRET_CODE) {
      setSecretCode(savedCode);
      setIsCodeVerified(true);
      if (savedName) setAuthorName(savedName);
      fetchMessages(savedCode);
    }
  }, [fetchMessages]);

  const verifyCode = () => {
    if (secretCode === APP_SECRET_CODE) {
      setIsCodeVerified(true);
      localStorage.setItem('love_code', secretCode);
      fetchMessages(secretCode);
      showNotification('🔓 ¡Código correcto! Bienvenido al muro de amor', 'success');
    } else {
      showNotification('❌ Código incorrecto. Intenta de nuevo', 'error');
    }
  };

  const getSampleMessages = () => {
    return [
      {
        id: '1',
        message: 'Eres la persona más especial de mi vida 💖',
        color: '#FFD6E0',
        style: 'heart',
        author: 'Yo',
        secret_code: APP_SECRET_CODE,
        is_pinned: true,
        position_x: 20,
        position_y: 30,
        rotation: -2,
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        message: 'Hoy soñé contigo, como todos los días 🌙',
        color: '#FFF9C4',
        style: 'star',
        author: 'Mi Amor',
        secret_code: APP_SECRET_CODE,
        is_pinned: false,
        position_x: 60,
        position_y: 40,
        rotation: 3,
        created_at: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: '3',
        message: 'Tu sonrisa ilumina mis días ☀️',
        color: '#E3F2FD',
        style: 'cloud',
        author: 'Tu Novio',
        secret_code: APP_SECRET_CODE,
        is_pinned: true,
        position_x: 40,
        position_y: 10,
        rotation: -1,
        created_at: new Date(Date.now() - 172800000).toISOString()
      }
    ];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      showNotification('💝 Escribe un mensaje primero', 'error');
      return;
    }

    try {
      const newNote = {
        message: newMessage.trim(),
        color: selectedColor,
        style: selectedStyle,
        author: authorName,
        secret_code: APP_SECRET_CODE,
        is_pinned: false,
        position_x: Math.random() * 80,
        position_y: Math.random() * 60,
        rotation: Math.random() * 10 - 5,
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('love_messages')
        .insert([newNote])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setMessages([data[0], ...messages]);
        setNewMessage('');
        setSelectedColor('#FFD6E0');
        setSelectedStyle('heart');
        setShowForm(false);
        showNotification(`💖 ¡Mensaje publicado como "${authorName}"!`, 'success');
      }
      
    } catch (error) {
      console.error('Error:', error);
      showNotification('❌ Error al guardar el mensaje', 'error');
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('love_messages')
        .update(updates)
        .eq('id', id)
        .eq('secret_code', APP_SECRET_CODE);

      if (error) throw error;

      setMessages(prev => 
        prev.map(msg => 
          msg.id === id ? { ...msg, ...updates } : msg
        )
      );
      
      showNotification('📝 Mensaje actualizado', 'success');
    } catch (error) {
      console.error('Error:', error);
      showNotification('❌ Error al actualizar', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este mensaje de amor? 💔')) return;

    try {
      const { error } = await supabase
        .from('love_messages')
        .delete()
        .eq('id', id)
        .eq('secret_code', APP_SECRET_CODE);

      if (error) throw error;

      setMessages(prev => prev.filter(msg => msg.id !== id));
      showNotification('🗑️ Mensaje eliminado', 'success');
    } catch (error) {
      console.error('Error:', error);
      showNotification('❌ Error al eliminar', 'error');
    }
  };

  const handleAuthorChange = (name) => {
    setAuthorName(name);
    localStorage.setItem('love_author', name);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Hoy';
    if (days === 1) return 'Ayer';
    if (days < 7) return `Hace ${days} días`;
    
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  };

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `love-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };

  const messageStats = {
    total: messages.length,
    pinned: messages.filter(m => m.is_pinned).length,
  };

  if (!isCodeVerified) {
    return (
      <div className="code-verification">
        <div className="verification-card">
          <h2>💌 Muro de Amor Secreto</h2>
          <p className="subtitle">Solo tú y tu pareja pueden acceder con el código especial</p>
          
          <div className="code-input-container">
            <input
              type="text"
              value={secretCode}
              onChange={(e) => setSecretCode(e.target.value)}
              placeholder="Ingresa el código secreto..."
              className="code-input"
              onKeyPress={(e) => e.key === 'Enter' && verifyCode()}
            />
            <button onClick={verifyCode} className="verify-btn">
              <span className="btn-icon">🔓</span>
              Acceder al Muro
            </button>
          </div>
          
          <p className="hint">💡 El código mantiene nuestros mensajes privados y seguros</p>
        </div>
      </div>
    );
  }

  return (
    <div className="love-letter-container">
       <Background />
      <div className="love-letter-header">
        <h1 className="love-letter-title">
          <span className="title-icon">💌</span>
          Nuestro Muro de Amor
          <span className="title-icon">💕</span>
        </h1>
        <p className="love-letter-subtitle">
          Cada mensaje es un latido de nuestro corazón compartido
        </p>
        
        <div className="stats-container">
          <div className="stat-card">
            <span className="stat-icon">📝</span>
            <span className="stat-count">{messageStats.total}</span>
            <span className="stat-label">Mensajes</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">📌</span>
            <span className="stat-count">{messageStats.pinned}</span>
            <span className="stat-label">Fijados</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">👤</span>
            <span className="stat-count">{authorName}</span>
            <span className="stat-label">Tú eres</span>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-buttons">
            <div className="filter-group">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                <span className="filter-icon">✨</span>
                Todos
              </button>
              <button
                className={`filter-btn ${filter === 'pinned' ? 'active' : ''}`}
                onClick={() => setFilter('pinned')}
              >
                <span className="filter-icon">📌</span>
                Fijados
              </button>
            </div>
            
            <button 
              className="logout-btn"
              onClick={() => {
                localStorage.removeItem('love_code');
                setIsCodeVerified(false);
              }}
            >
              <span className="btn-icon">🔒</span>
              Cerrar Sesión
            </button>
          </div>
          
          <button 
            className="add-note-btn"
            onClick={() => setShowForm(true)}
          >
            <span className="btn-icon">✏️</span>
            Escribir Mensaje de Amor
          </button>
        </div>
      </div>

      {showForm && (
        <div className="form-overlay" onClick={() => setShowForm(false)}>
          <div className="form-container" onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
              <h3>
                <span className="header-icon">💝</span>
                Nuevo Mensaje de Amor
                <span className="header-icon">💝</span>
              </h3>
              <button 
                className="close-form-btn"
                onClick={() => setShowForm(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* CUADRO DE AUTOR - CORREGIDO */}
              <div className="form-group author-group">
                <label className="form-label">
                  <span className="label-icon">👤</span>
                  ¿Quién escribe este mensaje?
                </label>
                <div className="author-input-wrapper">
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => handleAuthorChange(e.target.value)}
                    placeholder="Escribe tu nombre o apodo aquí..."
                    className="author-input-field"
                    maxLength="20"
                  />
                  <div className="author-preview">
                    <span className="preview-label">Aparecerá como:</span>
                    <span className="preview-name">{authorName || 'Anónimo'}</span>
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">💬</span>
                  Tu mensaje especial:
                </label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe aquí tu mensaje de amor... ¿Qué sientes hoy? ¿Qué recuerdas con cariño?"
                  maxLength="300"
                  rows="4"
                  className="message-textarea"
                  autoFocus
                />
                <div className="char-counter">
                  {newMessage.length}/300 caracteres
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">🎨</span>
                  Color del papelito:
                </label>
                <div className="color-options">
                  {colorOptions.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      className={`color-option ${selectedColor === color.value ? 'selected' : ''}`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => setSelectedColor(color.value)}
                      title={color.name}
                    >
                      {selectedColor === color.value && (
                        <span className="color-check">✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">
                  <span className="label-icon">✨</span>
                  Estilo del mensaje:
                </label>
                <div className="style-options">
                  {styleOptions.map(style => (
                    <button
                      key={style.value}
                      type="button"
                      className={`style-option ${selectedStyle === style.value ? 'selected' : ''}`}
                      onClick={() => setSelectedStyle(style.value)}
                      title={style.name}
                    >
                      <span className="style-option-icon">{style.icon}</span>
                      <span className="style-option-name">{style.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowForm(false)}
                >
                  <span className="action-icon">❌</span>
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={!newMessage.trim()}
                >
                  <span className="action-icon">💾</span>
                  Publicar como {authorName}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="wall-container" ref={wallRef}>
        {loading ? (
          <div className="loading-state">
            <div className="loading-hearts">
              <span>💖</span>
              <span>💕</span>
              <span>💗</span>
            </div>
            <p>Cargando nuestros mensajes de amor...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-wall">
            <div className="empty-message">
              <span className="empty-icon">💌</span>
              <h3>El muro está vacío</h3>
              <p>¡Escribe el primer mensaje de amor!</p>
              <button 
                className="start-writing-btn"
                onClick={() => setShowForm(true)}
              >
                <span className="btn-icon">✏️</span>
                Empezar a escribir
              </button>
            </div>
          </div>
        ) : (
          messages.map(message => (
            <LoveNote
              key={message.id}
              message={message}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              formatDate={formatDate}
            />
          ))
        )}
      </div>

      <div className="love-letter-footer">
        <p className="footer-text">
          💘 Conectados con el código secreto: <strong>{APP_SECRET_CODE}</strong>
        </p>
        <div className="footer-tips">
          <span className="tip">💡 Arrastra los papelitos para moverlos</span>
          <span className="tip">📌 Haz clic en el ícono para fijar/desfijar</span>
          <span className="tip">👤 Cambia tu nombre en el formulario</span>
        </div>
      </div>
    </div>
  );
};

const LoveNote = ({ message, onUpdate, onDelete, formatDate }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({
    x: message.position_x,
    y: message.position_y
  });
  const noteRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.target.closest('.note-actions')) return;
    
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = position.x;
    const startTop = position.y;

    const handleMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      const wall = document.querySelector('.wall-container');
      if (!wall) return;
      
      const wallRect = wall.getBoundingClientRect();
      const maxX = wallRect.width - (noteRef.current?.offsetWidth || 250);
      const maxY = wallRect.height - (noteRef.current?.offsetHeight || 200);
      
      const newX = Math.max(0, Math.min(maxX, startLeft + (deltaX / wallRect.width * 100)));
      const newY = Math.max(0, Math.min(maxY, startTop + (deltaY / wallRect.height * 100)));
      
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      onUpdate(message.id, {
        position_x: position.x,
        position_y: position.y
      });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const togglePin = () => {
    onUpdate(message.id, { is_pinned: !message.is_pinned });
  };

  return (
    <div
      ref={noteRef}
      className={`love-note ${message.style} ${message.is_pinned ? 'pinned' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        backgroundColor: message.color,
        transform: `rotate(${message.rotation}deg)`,
        zIndex: message.is_pinned ? 100 : 1
      }}
      onMouseDown={handleMouseDown}
    >
      {message.is_pinned && (
        <div className="pinned-badge" title="Mensaje fijado">
          <span className="pinned-icon">📌</span>
        </div>
      )}
      
      <div className="note-style-icon">
        {message.style === 'heart' && '❤️'}
        {message.style === 'star' && '⭐'}
        {message.style === 'flower' && '🌸'}
        {message.style === 'cloud' && '☁️'}
        {message.style === 'classic' && '📝'}
        {message.style === 'surprise' && '🎁'}
      </div>
      
      <div className="note-content">
        <p className="note-message">{message.message}</p>
        
        <div className="note-footer">
          <div className="note-meta">
            <span className="note-author">
              <span className="author-icon">👤</span>
              {message.author}
            </span>
            <span className="note-date">
              <span className="date-icon">📅</span>
              {formatDate(message.created_at)}
            </span>
          </div>
          
          <div className="note-actions">
            <button
              className="action-btn pin-btn"
              onClick={togglePin}
              title={message.is_pinned ? 'Desfijar mensaje' : 'Fijar mensaje'}
            >
              <span className="action-btn-icon">
                {message.is_pinned ? '📌' : '📍'}
              </span>
            </button>
            <button
              className="action-btn delete-btn"
              onClick={() => onDelete(message.id)}
              title="Eliminar mensaje"
            >
              <span className="action-btn-icon">🗑️</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoveLetter;