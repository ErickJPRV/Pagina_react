import React, { useState, useEffect } from 'react';
import './Gallery.css';
// Importamos la conexión a Supabase (asegúrate de que supabase.js esté en la carpeta src)
import { supabase } from '../supabase'; 
import { useBackgroundAnimation } from './BackgroundAnimations';
// ================= CONFIGURACIÓN =================
const CLOUD_NAME = 'de8fht5u8'; 
const UPLOAD_PRESET = 'aniversario_fotos'; 
// =================================================

function Gallery() {
  // Estados principales
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
   const { Background } = useBackgroundAnimation('gallery');
  // Estado del formulario
  const [newPhoto, setNewPhoto] = useState({
    title: '',
    description: '',
    imageFile: null,
    imagePreview: null,
    date: new Date().toISOString().split('T')[0]
  });

  // ================= 1. CARGAR DATOS DESDE SUPABASE =================
  const fetchRecuerdos = async () => {
    try {
      setLoading(true);
      // Pedimos los datos a la tabla 'recuerdos', ordenados por fecha de creación (más nuevos primero)
      let { data, error } = await supabase
        .from('recuerdos')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error("Error cargando recuerdos:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecuerdos();
  }, []);

  // ================= MANEJO DE ARCHIVOS =================
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('❌ Por favor selecciona solo archivos de imagen (JPG, PNG, GIF)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { 
      alert('❌ La imagen es muy grande. Máximo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewPhoto(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: reader.result
      }));
    };
    reader.readAsDataURL(file);
  };

  // ================= SUBIR A CLOUDINARY =================
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('cloud_name', CLOUD_NAME);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || 'Error subiendo imagen');
      return { success: true, url: data.secure_url };
    } catch (error) {
      console.error('Error Cloudinary:', error);
      return { success: false, error: error.message };
    }
  };

  // ================= GUARDAR EN SUPABASE (REEMPLAZA A LOCALSTORAGE) =================
  const handleUpload = async (event) => {
    event.preventDefault();
    
    if (!newPhoto.imageFile || !newPhoto.title.trim()) {
      alert('💝 Por favor selecciona una imagen y ponle título');
      return;
    }

    setUploading(true);

    try {
      // 1. Subir imagen a Cloudinary
      const uploadResult = await uploadToCloudinary(newPhoto.imageFile);
      
      if (!uploadResult.success) {
        throw new Error('No se pudo subir la imagen a la nube');
      }

      // 2. Guardar datos en Supabase (Base de datos real)
      const { error } = await supabase
        .from('recuerdos')
        .insert([
          {
            title: newPhoto.title,
            description: newPhoto.description,
            imageUrl: uploadResult.url,
            date: newPhoto.date,
            createdAt: new Date().toISOString()
            // Nota: No enviamos 'cloudinary: true' porque esa columna no existe en la BD
          }
        ]);

      if (error) throw error;

      // Éxito
      alert(`✨ ¡Foto "${newPhoto.title}" guardada exitosamente!`);
      
      // Recargar la lista desde la nube
      fetchRecuerdos();

      // Limpiar formulario
      setNewPhoto({
        title: '',
        description: '',
        imageFile: null,
        imagePreview: null,
        date: new Date().toISOString().split('T')[0]
      });
      
      setShowUploadForm(false);

    } catch (error) {
      console.error('Error:', error);
      alert('❌ Error al guardar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  // ================= BORRAR DE SUPABASE =================
  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta foto? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('recuerdos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      alert('🗑️ Foto eliminada');
      setSelectedPhoto(null); // Cerrar modal si está abierto
      fetchRecuerdos(); // Recargar lista
    } catch (error) {
      alert("Error al borrar: " + error.message);
    }
  };

  // ================= EDITAR EN SUPABASE =================
  const handleEdit = async (photo) => {
    const newTitle = prompt('Nuevo título:', photo.title);
    if (newTitle && newTitle.trim() !== photo.title) {
      try {
        const { error } = await supabase
          .from('recuerdos')
          .update({ title: newTitle.trim() })
          .eq('id', photo.id);

        if (error) throw error;

        alert('📝 Título actualizado');
        fetchRecuerdos(); // Recargar lista
        // Si el modal está abierto, actualizamos el título visualmente también
        setSelectedPhoto(prev => prev ? ({ ...prev, title: newTitle.trim() }) : null);
      } catch (error) {
        alert("Error al editar: " + error.message);
      }
    }
  };

  // ================= FUNCIONES AUXILIARES =================
  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Ajuste para evitar problemas de zona horaria al mostrar la fecha
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUploadDate = (dateString) => {
    if (!dateString) return '';
    const uploadDate = new Date(dateString);
    const now = new Date();
    
    if (uploadDate.toDateString() === now.toDateString()) {
      return 'Hoy';
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (uploadDate.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }
    return formatDate(dateString);
  };

  // ================= RENDER =================
  return (
    <div className="gallery-container">
      <Background />
      {/* ===== ENCABEZADO ===== */}
      <div className="gallery-header">
        <h1 className="gallery-title">
          <span className="title-icon">📸</span>
          Nuestra Galería de Amor
          <span className="title-icon">💖</span>
        </h1>
        
        {/* LOGICA DEL BOTÓN: Solo mostramos la descripción y botón superior si hay fotos */}
        {!loading && photos.length > 0 ? (
          <>
            <p className="gallery-subtitle">
              Cada foto es un capítulo de nuestra historia, cada recuerdo un tesoro del corazón
            </p>
            <div className="header-actions">
              <button 
                className={`upload-toggle-btn ${showUploadForm ? 'active' : ''}`}
                onClick={() => setShowUploadForm(!showUploadForm)}
              >
                {showUploadForm ? (
                  <>
                    <span className="btn-icon">❌</span>
                    Cancelar
                  </>
                ) : (
                  <>
                    <span className="btn-icon">📤</span>
                    Subir Nueva Foto
                  </>
                )}
              </button>
              
              <div className="stats-badge">
                <span className="stats-icon">🖼️</span>
                <span className="stats-count">{photos.length}</span>
                <span className="stats-text">{photos.length === 1 ? 'recuerdo' : 'recuerdos'}</span>
              </div>
            </div>
          </>
        ) : (
          null /* Si está vacío, no mostramos nada aquí abajo del título */
        )}
      </div>

      {/* ===== FORMULARIO DE SUBIDA ===== */}
      {showUploadForm && (
        <div className="upload-form-section">
          <div className="form-card">
            <div className="form-header">
              <h2>
                <span className="form-icon">💝</span>
                Guarda un Momento Especial
                <span className="form-icon">💝</span>
              </h2>
              <p className="form-subtitle">Este recuerdo será parte de nuestra historia para siempre</p>
            </div>

            <form onSubmit={handleUpload} className="upload-form">
              {/* PREVIEW DE IMAGEN */}
              <div className="image-section">
                {newPhoto.imagePreview ? (
                  <div className="image-preview-container">
                    <img 
                      src={newPhoto.imagePreview} 
                      alt="Preview" 
                      className="preview-image"
                    />
                    <button
                      type="button"
                      className="change-image-btn"
                      onClick={() => {
                        setNewPhoto(prev => ({ ...prev, imageFile: null, imagePreview: null }));
                        document.getElementById('file-input').value = '';
                      }}
                    >
                      🔄 Cambiar imagen
                    </button>
                  </div>
                ) : (
                  <div className="upload-area">
                    <label className="upload-label">
                      <div className="upload-icon">🖼️</div>
                      <div className="upload-text">
                        <strong>Haz clic para seleccionar una foto</strong>
                        <p className="upload-hint">JPG, PNG, GIF • Máximo 5MB</p>
                      </div>
                      <input
                        id="file-input"
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="file-input"
                        required
                      />
                    </label>
                  </div>
                )}
              </div>

              {/* CAMPOS DEL FORMULARIO */}
              <div className="form-fields">
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📝</span>
                    Título de la foto *
                  </label>
                  <input
                    type="text"
                    value={newPhoto.title}
                    onChange={(e) => setNewPhoto({...newPhoto, title: e.target.value})}
                    placeholder="Ej: Nuestra primera cita en la playa"
                    className="form-input"
                    maxLength="50"
                    required
                    disabled={uploading}
                  />
                  <div className="char-counter">
                    {newPhoto.title.length}/50 caracteres
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">💬</span>
                    Descripción (opcional)
                  </label>
                  <textarea
                    value={newPhoto.description}
                    onChange={(e) => setNewPhoto({...newPhoto, description: e.target.value})}
                    placeholder="Describe este momento especial... ¿Dónde estaban? ¿Qué sentiste?"
                    className="form-textarea"
                    rows="3"
                    maxLength="200"
                    disabled={uploading}
                  />
                  <div className="char-counter">
                    {newPhoto.description.length}/200 caracteres
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">📅</span>
                    Fecha del recuerdo
                  </label>
                  <input
                    type="date"
                    value={newPhoto.date}
                    onChange={(e) => setNewPhoto({...newPhoto, date: e.target.value})}
                    className="form-input"
                    disabled={uploading}
                  />
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="cancel-btn"
                  disabled={uploading}
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={uploading || !newPhoto.imageFile}
                >
                  {uploading ? (
                    <>
                      <span className="spinner"></span>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <span className="btn-icon">💾</span>
                      Guardar Recuerdo
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== GALERÍA DE FOTOS ===== */}
      <div className="gallery-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-hearts">
              <span>💗</span>
              <span>💖</span>
              <span>💕</span>
            </div>
            <p>Conectando con nuestros recuerdos especiales...</p>
          </div>
        ) : photos.length === 0 ? (
          // ===== GALERÍA VACÍA - MENSAJE BONITO (SE MUESTRA CUANDO NO HAY FOTOS) =====
          <div className="empty-gallery-message">
            <div className="floating-hearts">
              <span className="heart">❤️</span>
              <span className="heart">💖</span>
              <span className="heart">💕</span>
              <span className="heart">💗</span>
              <span className="heart">💓</span>
            </div>
            
            <div className="message-container">
              <div className="message-card">
                <div className="card-decoration top-left">🌸</div>
                <div className="card-decoration top-right">🌺</div>
                <div className="card-decoration bottom-left">🌼</div>
                <div className="card-decoration bottom-right">🌷</div>
                
                <div className="message-content">
                  <h2 className="message-title">
                    <span className="title-icon">📸</span>
                    Nuestra historia de Amor Comienza Aquí
                    <span className="title-icon">💝</span>
                  </h2>
                  
                  <div className="message-body">
                    <p className="romantic-quote">
                      "Las fotos más bellas no se toman, se viven. 
                      Y ahora, este espacio está listo para guardar cada uno 
                      de esos momentos vividos juntos."
                    </p>
                    
                    <div className="inspiration-section">
                      <div className="inspiration-item">
                        <div className="inspiration-icon">✨</div>
                        <div className="inspiration-text">
                          <h4>Primera Cita</h4>
                          <p>Esa sonrisa que lo cambió todo</p>
                        </div>
                      </div>
                      
                      <div className="inspiration-item">
                        <div className="inspiration-icon">🌟</div>
                        <div className="inspiration-text">
                          <h4>Aventuras Compartidas</h4>
                          <p>Lugares descubiertos juntos</p>
                        </div>
                      </div>
                      
                      <div className="inspiration-item">
                        <div className="inspiration-icon">💫</div>
                        <div className="inspiration-text">
                          <h4>Momentos Cotidianos</h4>
                          <p>Esos instantes que hacen la magia</p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="call-to-action">
                      Sube tu primera foto y comienza a escribir vuestra historia visual.
                      Cada imagen que agregues será un tesoro en este álbum de amor.
                    </p>
                  </div>
                  
                  <button 
                    className="start-journey-btn"
                    onClick={() => setShowUploadForm(true)}
                  >
                    <span className="btn-icon">✨</span>
                    Comenzar Nuestra Historia
                    <span className="btn-icon">✨</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // ===== GALERÍA CON FOTOS (GRID) =====
          <>
            <div className="photos-grid">
              {photos.map(photo => (
                <div key={photo.id} className="photo-card">
                  {/* BADGE DE NUBE (SIEMPRE VISIBLE) */}
                  <div className="cloud-badge">
                    <span className="badge-icon">☁️</span>
                    En la nube
                  </div>

                  {/* IMAGEN */}
                  <div 
                    className="photo-image-wrapper"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img 
                      src={photo.imageUrl} 
                      alt={photo.title}
                      className="photo-image"
                      loading="lazy"
                    />
                    <div className="image-overlay">
                      <div className="overlay-content">
                        <span className="view-icon">👁️</span>
                        <span className="view-text">Ver detalles</span>
                      </div>
                    </div>
                  </div>

                  {/* INFORMACIÓN */}
                  <div className="photo-info">
                    <div className="photo-header">
                      <h3 className="photo-title">{photo.title}</h3>
                      <span className="photo-time">{getUploadDate(photo.createdAt)}</span>
                    </div>
                    
                    {photo.description && (
                      <p className="photo-description">{photo.description}</p>
                    )}
                    
                    {/* ACCIONES */}
                    <div className="photo-actions">
                      <button 
                        className="action-btn edit-btn"
                        onClick={() => handleEdit(photo)}
                        title="Editar título"
                      >
                        <span className="action-icon">✏️</span>
                        Editar
                      </button>
                      
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => handleDelete(photo.id)}
                        title="Eliminar foto"
                      >
                        <span className="action-icon">🗑️</span>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ===== MODAL DE VISUALIZACIÓN ===== */}
      {selectedPhoto && (
        <div className="modal-overlay" onClick={() => setSelectedPhoto(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setSelectedPhoto(null)}
            >
              ✕
            </button>
            
            <div className="modal-content">
              {/* Imagen a la izquierda */}
              <div className="modal-image-section">
                <div className="modal-image-container">
                  <img 
                    src={selectedPhoto.imageUrl} 
                    alt={selectedPhoto.title}
                    className="modal-image"
                  />
                  <div className="modal-cloud-badge">
                    <span className="badge-icon">☁️</span>
                    Guardado en la nube
                  </div>
                </div>
              </div>
              
              {/* Información a la derecha */}
              <div className="modal-info-section">
                <div className="modal-header">
                  <h2 className="modal-title">{selectedPhoto.title}</h2>
                  <div className="modal-date-badge">
                    <span className="date-icon">📅</span>
                    <span className="date-text">{formatDate(selectedPhoto.date)}</span>
                  </div>
                </div>
                
                {selectedPhoto.description && (
                  <div className="modal-description-container">
                    <h3 className="description-label">
                      <span className="label-icon">💬</span>
                      Descripción:
                    </h3>
                    <p className="modal-description">{selectedPhoto.description}</p>
                  </div>
                )}
                
                {/* Tarjeta de detalles del recuerdo */}
                <div className="memory-details-card">
                  <div className="card-header">
                    <span className="card-icon">📋</span>
                    <h3 className="card-title">Detalles del Recuerdo</h3>
                  </div>
                  
                  <div className="card-content">
                    <div className="detail-row">
                      <div className="detail-label">
                        <span className="label-icon">📸</span>
                        <span className="label-text">Título:</span>
                      </div>
                      <div className="detail-value">{selectedPhoto.title}</div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-label">
                        <span className="label-icon">📅</span>
                        <span className="label-text">Fecha del recuerdo:</span>
                      </div>
                      <div className="detail-value">{formatDate(selectedPhoto.date)}</div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-label">
                        <span className="label-icon">⏰</span>
                        <span className="label-text">Subido:</span>
                      </div>
                      <div className="detail-value">{getUploadDate(selectedPhoto.createdAt)}</div>
                    </div>
                    
                    <div className="detail-row">
                      <div className="detail-label">
                        <span className="label-icon">💾</span>
                        <span className="label-text">Almacenamiento:</span>
                      </div>
                      <div className="detail-value">
                        <span className="storage-badge">
                          <span className="badge-icon">☁️</span>
                          Supabase
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Botones de acción */}
                <div className="modal-actions">
                  <button 
                    className="modal-action-btn edit-modal-btn"
                    onClick={() => {
                      setSelectedPhoto(null);
                      setTimeout(() => handleEdit(selectedPhoto), 100);
                    }}
                  >
                    <span className="btn-icon">✏️</span>
                    Editar Título
                  </button>
                  
                  <button 
                    className="modal-action-btn delete-modal-btn"
                    onClick={() => {
                      setSelectedPhoto(null);
                      setTimeout(() => handleDelete(selectedPhoto.id), 100);
                    }}
                  >
                    <span className="btn-icon">🗑️</span>
                    Eliminar Foto
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;