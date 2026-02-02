import React, { useState, useEffect } from 'react';
import './Timeline.css';

// 1. IMPORTAMOS AMBAS TECNOLOGÍAS (Híbrido)
import { db } from '../firebase/firebase'; // Para guardar los eventos del Timeline
import { supabase } from '../supabase'; // Para LEER las fotos de la galería
import { collection, addDoc, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
function Timeline() {
  // ================= ESTADOS =================
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
   const { Background } = useBackgroundAnimation('timeline');
  // Estados para el selector de fotos (Traídas de Supabase)
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(false);

  // Edición
  const [editingEventId, setEditingEventId] = useState(null);
  const [editTitle, setEditTitle] = useState('');

  // Nuevo Evento
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'memory',
    icon: '💕',
    imageUrl: '',
    color: '#ff6b8b',
    isImportant: false,
    selectedImageId: null
  });

  // ================= 1. CONEXIÓN A FIREBASE (TIMELINE) =================
  // Escucha en tiempo real los eventos guardados en Firebase
  useEffect(() => {
    // Ordenamos por fecha ascendente
    const q = query(collection(db, "timeline"), orderBy("date", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eventsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEvents(eventsData);
      setLoading(false);
    }, (error) => {
      console.error("Error conectando a Firebase:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ================= 2. CONEXIÓN A SUPABASE (SOLO LECTURA DE GALERÍA) =================
  // Esta función se llama cuando abres el selector de fotos
  const fetchGalleryPhotos = async () => {
    try {
      setLoadingGallery(true);
      // Leemos la tabla 'recuerdos' de Supabase
      let { data, error } = await supabase
        .from('recuerdos')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setGalleryPhotos(data || []);
    } catch (error) {
      console.error("Error leyendo galería de Supabase:", error.message);
      alert("No se pudo cargar la galería.");
    } finally {
      setLoadingGallery(false);
    }
  };

  const openGalleryPicker = () => {
    setShowGalleryPicker(true);
    fetchGalleryPhotos(); // Cargar fotos al momento
  };

  const handleSelectPhoto = (photo) => {
    // Al elegir una foto de Supabase, guardamos su URL en el estado local para enviarla a Firebase luego
    setNewEvent({
      ...newEvent,
      imageUrl: photo.imageUrl,
      selectedImageId: photo.id
    });
    setShowGalleryPicker(false);
  };

  // ================= 3. GUARDAR EVENTO EN FIREBASE =================
  const handleAddEvent = async (e) => {
    e.preventDefault();
    
    if (!newEvent.title.trim() || !newEvent.date) {
      alert('Por favor completa el título y la fecha');
      return;
    }

    try {
      // Guardamos en la colección "timeline" de FIREBASE
      await addDoc(collection(db, "timeline"), {
        title: newEvent.title,
        description: newEvent.description,
        date: newEvent.date,
        type: newEvent.type,
        icon: newEvent.icon,
        imageUrl: newEvent.imageUrl, // Aquí va la URL que sacamos de Supabase/Cloudinary
        color: newEvent.color,
        isImportant: newEvent.isImportant,
        createdAt: new Date().toISOString()
      });

      alert('✨ ¡Evento agregado al Timeline (Firebase)!');
      setShowEventForm(false);
      
      // Resetear form
      setNewEvent({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        type: 'memory',
        icon: '💕',
        imageUrl: '',
        color: '#ff6b8b',
        isImportant: false,
        selectedImageId: null
      });

    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error guardando en Firebase: ' + error.message);
    }
  };

  // ================= 4. OPERACIONES FIREBASE (BORRAR/EDITAR) =================
  const handleDeleteEvent = async (id) => {
    if (!window.confirm('¿Eliminar este evento del timeline?')) return;

    try {
      await deleteDoc(doc(db, "timeline", id));
      setSelectedEvent(null);
    } catch (error) {
      alert('❌ Error eliminando: ' + error.message);
    }
  };

  const handleSaveEdit = async (eventId) => {
    if (!editTitle.trim()) return;

    try {
      await updateDoc(doc(db, "timeline", eventId), {
        title: editTitle
      });
      setEditingEventId(null);
      setEditTitle('');
    } catch (error) {
      alert('❌ Error actualizando: ' + error.message);
    }
  };

  const toggleEventImportance = async (event) => {
    try {
      await updateDoc(doc(db, "timeline", event.id), {
        isImportant: !event.isImportant
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // ================= HELPERS UI =================
  const handleEditTitle = (event) => {
    setEditingEventId(event.id);
    setEditTitle(event.title);
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setEditTitle('');
  };

  const formatDate = (dateString) => {
    if(!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  };

  const getEventIcon = (type) => {
    const icons = {
      memory: '💖', love: '❤️', trip: '✈️', date: '🍽️',
      achievement: '🏆', surprise: '🎁', family: '👨‍👩‍👧‍👦', home: '🏠'
    };
    return icons[type] || '📌';
  };

  const getEventColor = (type) => {
    const colors = {
      memory: '#ff6b8b', love: '#ff3366', trip: '#4776E6', date: '#8E54E9',
      achievement: '#00b09b', surprise: '#FFD700', family: '#9C27B0', home: '#4CAF50'
    };
    return colors[type] || '#ff6b8b';
  };

  // ================= RENDER =================
  return (
    <div className="timeline-container">
      {/* ===== ENCABEZADO ===== */}
      <div className="timeline-header">
        <div className="header-top">
          <h1 className="timeline-title">
            <span className="title-icon">📅</span>
            Nuestra Historia
          </h1>
          <div className="connection-status connected">
            <div className="status-dot"></div>
            <span>Firebase + Supabase</span>
          </div>
        </div>

        <p className="timeline-subtitle">
          Cronología de nuestros momentos, guardada en Firebase y enlazada con tu Galería
        </p>

        <div className="header-actions">
          <button 
            className="add-event-btn"
            onClick={() => setShowEventForm(!showEventForm)}
          >
            <span className="btn-icon">{showEventForm ? '✖' : '+'}</span>
            {showEventForm ? 'Cerrar' : 'Agregar Evento'}
          </button>

          <div className="cloud-stats">
            <div className="stat-item">
              <span className="stat-icon">📅</span>
              <div>
                <div className="stat-label">Eventos</div>
                <div className="stat-value">{events.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FORMULARIO DE EVENTO ===== */}
      {showEventForm && (
        <div className="add-event-form">
          <div className="form-header">
            <h2><span className="form-icon">✨</span> Nuevo Capítulo <span className="form-icon">✨</span></h2>
          </div>

          <form onSubmit={handleAddEvent}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">📝 Título *</label>
                <input type="text" className="form-input" value={newEvent.title} onChange={(e) => setNewEvent({...newEvent, title: e.target.value})} placeholder="Ej: Nuestra primera cita" required />
              </div>
              <div className="form-group">
                <label className="form-label">📅 Fecha *</label>
                <input type="date" className="form-input" value={newEvent.date} onChange={(e) => setNewEvent({...newEvent, date: e.target.value})} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">💬 Descripción (opcional)</label>
              <textarea className="form-textarea" value={newEvent.description} onChange={(e) => setNewEvent({...newEvent, description: e.target.value})} placeholder="Detalles de este día..." rows="3" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">🎨 Tipo</label>
                <select className="form-select" value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value, color: getEventColor(e.target.value), icon: getEventIcon(e.target.value) })}>
                  <option value="memory">💖 Recuerdo</option>
                  <option value="love">❤️ Amor</option>
                  <option value="trip">✈️ Viaje</option>
                  <option value="date">🍽️ Cita</option>
                  <option value="achievement">🏆 Logro</option>
                  <option value="surprise">🎁 Sorpresa</option>
                  <option value="family">👨‍👩‍👧‍👦 Familia</option>
                  <option value="home">🏠 Hogar</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">🎨 Color</label>
                <input type="color" className="form-input color-picker" value={newEvent.color} onChange={(e) => setNewEvent({...newEvent, color: e.target.value})} style={{ height: '50px' }} />
              </div>
            </div>

            {/* SELECCIÓN DE IMAGEN (Lee de Supabase) */}
            <div className="form-section">
              <label className="form-label">🖼️ Imagen (de la Galería)</label>
              {newEvent.imageUrl ? (
                <div className="selected-image-preview">
                  <img src={newEvent.imageUrl} alt="Preview" className="preview-image" />
                  <div className="preview-actions">
                    <button type="button" className="change-image-btn" onClick={openGalleryPicker}>🔄 Cambiar</button>
                    <button type="button" className="remove-image-btn" onClick={() => setNewEvent({ ...newEvent, imageUrl: '', selectedImageId: null })}>❌ Quitar</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="select-image-btn" onClick={openGalleryPicker}>
                  <span className="btn-icon">🖼️</span> Elegir de la Galería
                </button>
              )}
            </div>

            <label className="checkbox-label">
              <input type="checkbox" className="checkbox-input" checked={newEvent.isImportant} onChange={(e) => setNewEvent({ ...newEvent, isImportant: e.target.checked })} />
              <span className="checkbox-text">⭐ Marcar como hito importante</span>
            </label>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setShowEventForm(false)}>Cancelar</button>
              <button type="submit" className="submit-btn" disabled={!newEvent.title || !newEvent.date}>💾 Guardar en Timeline</button>
            </div>
          </form>
        </div>
      )}

      {/* ===== SELECTOR DE FOTOS (MODAL CON DATOS DE SUPABASE) ===== */}
      {showGalleryPicker && (
        <div className="gallery-picker-modal">
          <div className="picker-header">
            <h3>📸 Fotos de vuestra Galería (Supabase)</h3>
            <button className="close-picker" onClick={() => setShowGalleryPicker(false)}>✕</button>
          </div>
          <div className="picker-content">
            {loadingGallery ? (
              <p style={{textAlign: 'center', padding: '20px'}}>Cargando fotos de la nube...</p>
            ) : galleryPhotos.length === 0 ? (
              <div className="no-photos-message">
                <h4>No hay fotos disponibles</h4>
                <p>Ve a la sección "Galería" para subir fotos primero.</p>
              </div>
            ) : (
              <div className="photo-grid">
                {galleryPhotos.map(photo => (
                  <div key={photo.id} className={`photo-item ${newEvent.selectedImageId === photo.id ? 'selected' : ''}`} onClick={() => handleSelectPhoto(photo)}>
                    <img src={photo.imageUrl} alt={photo.title} className="photo-thumb" />
                    {newEvent.selectedImageId === photo.id && <div className="selected-indicator">✓</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== LISTA DE EVENTOS (DESDE FIREBASE) ===== */}
      <div className="timeline-content">
        {loading ? (
          <div className="loading-state"><p>Cargando historia desde Firebase...</p></div>
        ) : events.length === 0 ? (
          <div className="empty-timeline">
            <h2>Nuestra historia comienza aquí 📖</h2>
            <p>Agrega el primer evento para empezar la línea de tiempo.</p>
            <button className="first-event-btn" onClick={() => setShowEventForm(true)}>✨ Crear Primer Evento</button>
          </div>
        ) : (
          <div className="timeline">
            <div className="timeline-line"></div>
            {events.map((event, index) => (
              <div key={event.id} className={`timeline-event ${index % 2 === 0 ? 'left' : 'right'} ${event.isImportant ? 'important' : ''}`} style={{ '--event-color': event.color }}>
                <div className="event-point" onClick={() => setSelectedEvent(event)} style={{ borderColor: event.color }}>
                  <span className="point-icon">{event.icon}</span>
                </div>
                <div className="event-content">
                  <div className="event-header">
                    {editingEventId === event.id ? (
                      <div className="edit-title">
                        <input type="text" className="edit-input" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus />
                        <button className="edit-save" onClick={() => handleSaveEdit(event.id)}>💾</button>
                        <button className="edit-cancel" onClick={handleCancelEdit}>❌</button>
                      </div>
                    ) : (
                      <>
                        <h3 className="event-title" onClick={() => handleEditTitle(event)} style={{ color: event.color }}>
                          {event.title} {event.isImportant && '⭐'}
                        </h3>
                        <span className="event-date">{formatDate(event.date)}</span>
                      </>
                    )}
                  </div>
                  {event.description && <p className="event-description">{event.description}</p>}
                  {event.imageUrl && (
                    <div className="event-image" onClick={() => setSelectedEvent(event)}>
                      <img src={event.imageUrl} alt={event.title} />
                    </div>
                  )}
                  <div className="event-actions">
                    <button className="action-btn edit-btn" onClick={() => handleEditTitle(event)}>✏️</button>
                    <button className="action-btn delete-btn" onClick={() => handleDeleteEvent(event.id)}>🗑️</button>
                    <button className={`action-btn star-btn ${event.isImportant ? 'starred' : ''}`} onClick={() => toggleEventImportance(event)}>{event.isImportant ? '⭐' : '☆'}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== MODAL DETALLE ===== */}
      {selectedEvent && (
        <div className="event-modal">
          <div className="modal-content">
            <button className="close-modal" onClick={() => setSelectedEvent(null)}>✕</button>
            <div className="modal-header">
              <div className="modal-icon" style={{ background: `linear-gradient(135deg, ${selectedEvent.color}, ${selectedEvent.color}99)` }}>{selectedEvent.icon}</div>
              <div className="modal-header-text">
                <h2>{selectedEvent.title}</h2>
                <span className="modal-date">{formatDate(selectedEvent.date)}</span>
              </div>
            </div>
            <div className="modal-body">
              {selectedEvent.imageUrl && <div className="modal-image"><img src={selectedEvent.imageUrl} alt={selectedEvent.title} /></div>}
              {selectedEvent.description && <div className="modal-description"><h3>💬 Detalles</h3><p>{selectedEvent.description}</p></div>}
            </div>
            <div className="modal-footer">
              <button className="delete-btn" onClick={() => { if(window.confirm('¿Borrar?')) { handleDeleteEvent(selectedEvent.id); setSelectedEvent(null); }}}>🗑️ Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Timeline;