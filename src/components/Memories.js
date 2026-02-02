import React, { useState, useEffect, useCallback } from 'react'; // Añadido useCallback
import { supabase } from '../supabase';
import './Calendar.css';
import { useBackgroundAnimation } from './BackgroundAnimations';
const Memories = () => {
  const [events, setEvents] = useState([]);
  const [setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [isCodeVerified, setIsCodeVerified] = useState(false);
  const [isEditing, setIsEditing] = useState(false); // Nuevo estado para modo edición
   const { Background } = useBackgroundAnimation('memories');
  const APP_SECRET_CODE = 'AMOR2024';

  const [newEvent, setNewEvent] = useState({
    id: '', // Agregar ID para edición
    title: '',
    description: '',
    event_date: new Date().toISOString().split('T')[0],
    event_type: 'date',
    importance: 3,
    repeat_yearly: true,
    location: '',
    gifts: [],
    emotions: []
  });

  const EVENT_TYPES = [
    { id: 'birthday', name: '🎂 Cumpleaños', color: '#FF6B8B', icon: '🎂' },
    { id: 'anniversary', name: '💘 Aniversario', color: '#FF3366', icon: '💖' },
    { id: 'date', name: '💑 Cita Especial', color: '#FF8E53', icon: '🍽️' },
    { id: 'trip', name: '✈️ Viaje', color: '#4F46E5', icon: '🧳' },
    { id: 'first', name: '🥇 Primera Vez', color: '#10B981', icon: '⭐' },
    { id: 'goal', name: '🏆 Logro', color: '#F59E0B', icon: '🎯' },
    { id: 'special', name: '✨ Día Especial', color: '#8B5CF6', icon: '🎉' },
    { id: 'memory', name: '📸 Recuerdo', color: '#06B6D4', icon: '📸' }
  ];

  const IMPORTANCE_LEVELS = [
    { value: 1, label: '⭐ Normal', hearts: '❤️' },
    { value: 2, label: '⭐⭐ Importante', hearts: '❤️❤️' },
    { value: 3, label: '⭐⭐⭐ Muy Importante', hearts: '❤️❤️❤️' },
    { value: 4, label: '⭐⭐⭐⭐ Especial', hearts: '❤️❤️❤️❤️' },
    { value: 5, label: '⭐⭐⭐⭐⭐ Inolvidable', hearts: '❤️❤️❤️❤️❤️' }
  ];

  // ================= FUNCIONES CORREGIDAS PARA TIMEZONE =================
const checkTodayEvents = (eventsList) => {
    const todayEvents = eventsList.filter(event => isToday(event.event_date));
    
    if (todayEvents.length > 0) {
      console.log(`🎉 Hay ${todayEvents.length} eventos hoy!`);
      showNotification(`🎉 ¡Tienes ${todayEvents.length} evento(s) hoy!`, 'success');
    }
  };
  // Crear fecha local sin problemas de timezone
  const createLocalDate = (year, month, day) => {
    return new Date(year, month, day);
  };

  // Convertir cualquier fecha a fecha local (sin horas/minutos/segundos)
  const toLocalDate = (dateInput) => {
    if (!dateInput) return createLocalDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
    
    if (dateInput instanceof Date) {
      return createLocalDate(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
    }
    
    if (typeof dateInput === 'string') {
      // Si es formato ISO (YYYY-MM-DD)
      if (dateInput.includes('-')) {
        const parts = dateInput.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1; // Meses son 0-indexed
          const day = parseInt(parts[2]);
          return createLocalDate(year, month, day);
        }
      }
      // Si es otra cadena de fecha
      const date = new Date(dateInput);
      return createLocalDate(date.getFullYear(), date.getMonth(), date.getDate());
    }
    
    // Para otros casos
    const date = new Date(dateInput);
    return createLocalDate(date.getFullYear(), date.getMonth(), date.getDate());
  };

  // Comparar si dos fechas son iguales (solo día, mes, año)
  const areDatesEqual = (date1, date2) => {
    const d1 = toLocalDate(date1);
    const d2 = toLocalDate(date2);
    return d1.getTime() === d2.getTime();
  };

  // Verificar si es hoy
  const isToday = (dateInput) => {
    const today = toLocalDate(new Date());
    const compareDate = toLocalDate(dateInput);
    return today.getTime() === compareDate.getTime();
  };

  // Calcular días faltantes
  const calculateDaysUntil = (eventDate) => {
    const today = toLocalDate(new Date());
    const target = toLocalDate(eventDate);
    const diff = target - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Formatear fecha para mostrar
  const formatDateDisplay = (dateInput) => {
    const date = toLocalDate(dateInput);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formatear fecha para input type="date"
  const formatDateForInput = (dateInput) => {
    const date = toLocalDate(dateInput);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
const fetchEvents = useCallback(async (code) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('love_calendar')
        .select('*')
        .eq('secret_code', code)
        .order('event_date', { ascending: true });

      if (error) throw error;
      
      // Normalizar fechas al cargarlas
      const normalizedEvents = (data || []).map(event => ({
        ...event,
        // Asegurar que la fecha esté en formato correcto
        event_date: event.event_date
      }));
      
      // Combinar con eventos locales si existen
      const localEvents = getLocalEvents();
      const allEvents = [...normalizedEvents, ...localEvents];
      setEvents(allEvents);
      
      // Verificar eventos de hoy
      checkTodayEvents(allEvents);
      
    } catch (error) {
      console.error('Error:', error);
      const localEvents = getLocalEvents();
      if (localEvents.length > 0) {
        setEvents(localEvents);
        checkTodayEvents(localEvents);
      } else {
        const sampleEvents = getSampleEvents();
        setEvents(sampleEvents);
        checkTodayEvents(sampleEvents);
      }
    } finally {
      setLoading(false);
    }
  },[setLoading, checkTodayEvents]);
  useEffect(() => {
    const savedCode = localStorage.getItem('calendar_code');
    if (savedCode === APP_SECRET_CODE) {
      setSecretCode(savedCode);
      setIsCodeVerified(true);
      fetchEvents(savedCode);
    }
  }, [fetchEvents]);

  // Verificar eventos de hoy y mostrar notificación
  

  const getLocalEvents = () => {
    try {
      const localEvents = JSON.parse(localStorage.getItem('love_calendar_local') || '[]');
      return localEvents;
    } catch (e) {
      return [];
    }
  };

  const saveLocalEvent = (event) => {
    try {
      const localEvents = getLocalEvents();
      localEvents.push(event);
      localStorage.setItem('love_calendar_local', JSON.stringify(localEvents));
    } catch (e) {
      console.error('Error al guardar localmente:', e);
    }
  };

  const updateLocalEvent = (updatedEvent) => {
    try {
      const localEvents = getLocalEvents();
      const index = localEvents.findIndex(e => e.id === updatedEvent.id);
      if (index !== -1) {
        localEvents[index] = updatedEvent;
        localStorage.setItem('love_calendar_local', JSON.stringify(localEvents));
      }
    } catch (e) {
      console.error('Error al actualizar localmente:', e);
    }
  };

  const getSampleEvents = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    return [
      {
        id: '1',
        title: '🎂 Cumpleaños Especial',
        event_date: `${currentYear}-02-14`,
        event_type: 'birthday',
        importance: 5,
        repeat_yearly: true,
        description: 'Un día muy especial para celebrar',
        location: 'Lugar favorito',
        secret_code: APP_SECRET_CODE
      },
      {
        id: '2',
        title: '💘 Aniversario',
        event_date: `${currentYear}-03-20`,
        event_type: 'anniversary',
        importance: 5,
        repeat_yearly: true,
        description: 'Celebrando nuestro amor',
        location: 'Donde empezó todo',
        secret_code: APP_SECRET_CODE
      },
      {
        id: '3',
        title: '✈️ Viaje Romántico',
        event_date: `${currentYear}-07-10`,
        event_type: 'trip',
        importance: 4,
        repeat_yearly: false,
        description: 'Aventuras juntos',
        location: 'Destino especial',
        secret_code: APP_SECRET_CODE
      },
      {
        id: '4',
        title: '🥇 Primera Cita',
        event_date: `${currentYear}-01-15`,
        event_type: 'first',
        importance: 5,
        repeat_yearly: true,
        description: 'El día que todo comenzó',
        location: 'Cafetería favorita',
        secret_code: APP_SECRET_CODE
      },
      {
        id: '5',
        title: '🎉 Día Especial',
        event_date: `${currentYear}-12-25`,
        event_type: 'special',
        importance: 4,
        repeat_yearly: true,
        description: 'Celebración especial juntos',
        location: 'En casa',
        secret_code: APP_SECRET_CODE
      }
    ];
  };

  // ================= FUNCIÓN PARA AGREGAR NUEVO EVENTO =================
  const handleAddEvent = async (eventData) => {
    try {
      console.log('Agregando evento:', eventData);
      
      // Validar campos requeridos
      if (!eventData.title?.trim()) {
        showNotification('❌ El título es requerido', 'error');
        return;
      }

      // CORRECCIÓN DE TIMEZONE: Asegurar que la fecha se guarde correctamente
      const eventDate = toLocalDate(eventData.event_date);
      const formattedDate = formatDateForInput(eventDate);

      // Crear objeto de evento
      const eventToAdd = {
        id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: eventData.title,
        description: eventData.description || '',
        event_date: formattedDate, // Usar fecha formateada
        event_type: eventData.event_type,
        importance: eventData.importance,
        repeat_yearly: eventData.repeat_yearly,
        location: eventData.location || '',
        gifts: eventData.gifts || [],
        emotions: eventData.emotions || [],
        secret_code: APP_SECRET_CODE,
        created_by: 'Yo',
        created_at: new Date().toISOString()
      };

      // Agregar al estado inmediatamente
      setEvents(prev => [...prev, eventToAdd]);
      
      // Guardar localmente
      saveLocalEvent(eventToAdd);
      
      // Cerrar formulario y resetear
      setShowForm(false);
      resetForm();
      setIsEditing(false);
      
      // Mostrar notificación
      showNotification('📅 ¡Evento agregado exitosamente!', 'success');
      
      // Verificar si es evento de hoy
      if (isToday(eventToAdd.event_date)) {
        showNotification('🎉 ¡Este evento es para hoy!', 'success');
      }
      
      console.log('Evento agregado:', eventToAdd);

      // Intentar guardar en Supabase en segundo plano
      setTimeout(async () => {
        try {
          const { data, error } = await supabase
            .from('love_calendar')
            .insert([{
              title: eventToAdd.title,
              description: eventToAdd.description,
              event_date: eventToAdd.event_date,
              event_type: eventToAdd.event_type,
              importance: eventToAdd.importance,
              repeat_yearly: eventToAdd.repeat_yearly,
              location: eventToAdd.location,
              gifts: eventToAdd.gifts,
              emotions: eventToAdd.emotions,
              secret_code: eventToAdd.secret_code,
              created_by: eventToAdd.created_by,
              created_at: eventToAdd.created_at
            }])
            .select();

          if (error) {
            console.warn('No se pudo guardar en Supabase:', error.message);
            return;
          }

          if (data && data.length > 0) {
            console.log('Evento guardado en Supabase:', data[0]);
            // Actualizar con ID de Supabase
            setEvents(prev => 
              prev.map(event => 
                event.id === eventToAdd.id ? { ...data[0], id: data[0].id } : event
              )
            );
          }
        } catch (supabaseError) {
          console.warn('Error de conexión con Supabase:', supabaseError.message);
        }
      }, 100);

    } catch (error) {
      console.error('Error inesperado:', error);
      showNotification('❌ Error al agregar evento', 'error');
    }
  };

  // ================= FUNCIÓN PARA ACTUALIZAR EVENTO EXISTENTE =================
  const handleUpdateEvent = async (eventData) => {
    try {
      console.log('Actualizando evento:', eventData);
      
      // Validar campos requeridos
      if (!eventData.title?.trim()) {
        showNotification('❌ El título es requerido', 'error');
        return;
      }

      if (!eventData.id) {
        showNotification('❌ No se puede actualizar: ID no válido', 'error');
        return;
      }

      // CORRECCIÓN DE TIMEZONE: Asegurar que la fecha se guarde correctamente
      const eventDate = toLocalDate(eventData.event_date);
      const formattedDate = formatDateForInput(eventDate);

      // Crear objeto de evento actualizado
      const updatedEvent = {
        ...eventData,
        event_date: formattedDate,
        updated_at: new Date().toISOString()
      };

      // Actualizar en el estado inmediatamente
      setEvents(prev => 
        prev.map(event => 
          event.id === updatedEvent.id ? updatedEvent : event
        )
      );
      
      // Actualizar localmente
      updateLocalEvent(updatedEvent);
      
      // Cerrar formulario y resetear
      setShowForm(false);
      resetForm();
      setIsEditing(false);
      setSelectedEvent(null);
      
      // Mostrar notificación
      showNotification('✏️ ¡Evento actualizado exitosamente!', 'success');
      
      console.log('Evento actualizado:', updatedEvent);

      // Intentar actualizar en Supabase en segundo plano
      setTimeout(async () => {
        try {
          // Verificar si es un evento de Supabase (tiene ID numérico o no empieza con 'local_')
          const isSupabaseEvent = !updatedEvent.id.startsWith('local_');
          
          if (isSupabaseEvent) {
            const { error } = await supabase
              .from('love_calendar')
              .update({
                title: updatedEvent.title,
                description: updatedEvent.description,
                event_date: updatedEvent.event_date,
                event_type: updatedEvent.event_type,
                importance: updatedEvent.importance,
                repeat_yearly: updatedEvent.repeat_yearly,
                location: updatedEvent.location,
                gifts: updatedEvent.gifts,
                emotions: updatedEvent.emotions,
                updated_at: updatedEvent.updated_at
              })
              .eq('id', updatedEvent.id);

            if (error) {
              console.warn('No se pudo actualizar en Supabase:', error.message);
              return;
            }

            console.log('Evento actualizado en Supabase:', updatedEvent.id);
          } else {
            console.log('Evento local, no se sincroniza con Supabase');
          }
        } catch (supabaseError) {
          console.warn('Error de conexión con Supabase:', supabaseError.message);
        }
      }, 100);

    } catch (error) {
      console.error('Error inesperado:', error);
      showNotification('❌ Error al actualizar evento', 'error');
    }
  };

  // ================= FUNCIÓN PARA ELIMINAR EVENTO =================
  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      return;
    }

    try {
      // Eliminar del estado
      setEvents(prev => prev.filter(event => event.id !== eventId));
      
      // Eliminar localmente
      deleteLocalEvent(eventId);
      
      // Cerrar modal si está abierto
      setSelectedEvent(null);
      
      // Mostrar notificación
      showNotification('🗑️ Evento eliminado exitosamente', 'success');

      // Intentar eliminar de Supabase en segundo plano
      setTimeout(async () => {
        try {
          // Verificar si es un evento de Supabase
          const isSupabaseEvent = !eventId.startsWith('local_');
          
          if (isSupabaseEvent) {
            const { error } = await supabase
              .from('love_calendar')
              .delete()
              .eq('id', eventId);

            if (error) {
              console.warn('No se pudo eliminar de Supabase:', error.message);
              return;
            }

            console.log('Evento eliminado de Supabase:', eventId);
          } else {
            console.log('Evento local eliminado:', eventId);
          }
        } catch (supabaseError) {
          console.warn('Error de conexión con Supabase:', supabaseError.message);
        }
      }, 100);

    } catch (error) {
      console.error('Error al eliminar evento:', error);
      showNotification('❌ Error al eliminar evento', 'error');
    }
  };

  const deleteLocalEvent = (eventId) => {
    try {
      const localEvents = getLocalEvents();
      const filteredEvents = localEvents.filter(event => event.id !== eventId);
      localStorage.setItem('love_calendar_local', JSON.stringify(filteredEvents));
    } catch (e) {
      console.error('Error al eliminar localmente:', e);
    }
  };

  const resetForm = () => {
    setNewEvent({
      id: '',
      title: '',
      description: '',
      event_date: formatDateForInput(new Date()),
      event_type: 'date',
      importance: 3,
      repeat_yearly: true,
      location: '',
      gifts: [],
      emotions: []
    });
    setIsEditing(false);
  };

  // Función para abrir formulario en modo edición
  const openEditForm = (event) => {
    setNewEvent({
      id: event.id,
      title: event.title,
      description: event.description || '',
      event_date: formatDateForInput(event.event_date),
      event_type: event.event_type,
      importance: event.importance,
      repeat_yearly: event.repeat_yearly,
      location: event.location || '',
      gifts: event.gifts || [],
      emotions: event.emotions || []
    });
    setIsEditing(true);
    setShowForm(true);
    setSelectedEvent(null);
  };

  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.className = `memory-notification ${type}`;
    notification.textContent = message;
    
    // Estilos inline para asegurar que se vea
    notification.style.cssText = `
      position: fixed;
      top: 40px;
      right: 40px;
      padding: 20px 25px;
      border-radius: 15px;
      color: white;
      font-weight: 700;
      z-index: 9999;
      opacity: 0;
      transform: translateX(100px);
      transition: all 0.4s ease;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      min-width: 300px;
      max-width: 400px;
      backdrop-filter: blur(10px);
      border: 2px solid rgba(255, 255, 255, 0.2);
      font-size: 1rem;
      ${type === 'success' ? 
        'background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);' : 
        type === 'error' ?
        'background: linear-gradient(135deg, #f44336 0%, #c62828 100%);' :
        'background: linear-gradient(135deg, #2196F3 0%, #0D47A1 100%);'}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(100px)';
      setTimeout(() => {
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  };

  const getUpcomingEvents = () => {
    const today = toLocalDate(new Date());
    
    return events
      .filter(event => {
        const eventDate = toLocalDate(event.event_date);
        return eventDate >= today;
      })
      .sort((a, b) => toLocalDate(a.event_date) - toLocalDate(b.event_date))
      .slice(0, 5);
  };


  const verifyCode = () => {
    if (secretCode === APP_SECRET_CODE) {
      setIsCodeVerified(true);
      localStorage.setItem('calendar_code', secretCode);
      fetchEvents(secretCode);
      showNotification('🔓 ¡Bienvenido al calendario de amor!', 'success');
    } else {
      showNotification('❌ Código incorrecto', 'error');
    }
  };

  // ================= COMPONENTE VISTA MES CORREGIDO =================
  const MonthView = () => {
    const firstDay = createLocalDate(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = createLocalDate(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const days = [];
    
    // Días del mes anterior
    const prevMonthLastDay = createLocalDate(currentDate.getFullYear(), currentDate.getMonth(), 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      days.push({
        date: createLocalDate(currentDate.getFullYear(), currentDate.getMonth() - 1, day),
        isCurrentMonth: false
      });
    }
    
    // Días del mes actual
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        date: createLocalDate(currentDate.getFullYear(), currentDate.getMonth(), i),
        isCurrentMonth: true
      });
    }
    
    // Días del próximo mes
    const totalCells = 42; // 6 semanas
    const nextMonthDays = totalCells - days.length;
    for (let i = 1; i <= nextMonthDays; i++) {
      days.push({
        date: createLocalDate(currentDate.getFullYear(), currentDate.getMonth() + 1, i),
        isCurrentMonth: false
      });
    }

    return (
      <div className="month-view">
        <div className="month-grid">
          <div className="weekdays">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>
          
          <div className="days-grid">
            {days.map((day, index) => {
              // CORRECCIÓN: Usar areDatesEqual para comparar
              const dayEvents = events.filter(event => 
                areDatesEqual(event.event_date, day.date)
              );
              
              const today = isToday(day.date);
              const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
              
              return (
                <div 
                  key={index}
                  className={`day-cell ${!day.isCurrentMonth ? 'other-month' : ''} ${today ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}
                  onClick={() => {
                    if (dayEvents.length > 0) {
                      // Si hay múltiples eventos, mostrar lista
                      if (dayEvents.length > 1) {
                        const eventList = dayEvents.map(e => `• ${e.title}`).join('\n');
                        alert(`Eventos para ${formatDateDisplay(day.date)}:\n${eventList}`);
                      } else {
                        // Si hay solo un evento, mostrar detalles
                        setSelectedEvent(dayEvents[0]);
                      }
                    }
                  }}
                >
                  <div className="day-header">
                    <span className="day-number">{day.date.getDate()}</span>
                    {today && <span className="today-badge">Hoy</span>}
                  </div>
                  
                  <div className="day-events">
                    {dayEvents.slice(0, 3).map(event => {
                      const eventType = EVENT_TYPES.find(t => t.id === event.event_type);
                      return (
                        <div 
                          key={event.id}
                          className="event-item"
                          style={{ 
                            borderLeftColor: eventType?.color, 
                            backgroundColor: `${eventType?.color}15`
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(event);
                          }}
                          title={`${event.title} (Click para detalles)`}
                        >
                          <span className="event-icon">{eventType?.icon}</span>
                          <span className="event-title">{event.title}</span>
                        </div>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div 
                        className="more-events" 
                        onClick={(e) => {
                          e.stopPropagation();
                          const eventList = dayEvents.map(e => `• ${e.title}`).join('\n');
                          alert(`Eventos para ${formatDateDisplay(day.date)}:\n${eventList}`);
                        }}
                        title={`Ver ${dayEvents.length - 3} eventos más`}
                      >
                        +{dayEvents.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ================= COMPONENTE VISTA SEMANA CORREGIDO =================
  const WeekView = () => {
    const getWeekDates = () => {
      const weekDates = [];
      const current = toLocalDate(currentDate);
      
      // Ajustar al inicio de la semana (domingo)
      const startOfWeek = new Date(current);
      startOfWeek.setDate(current.getDate() - current.getDay());
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        weekDates.push(createLocalDate(date.getFullYear(), date.getMonth(), date.getDate()));
      }
      
      return weekDates;
    };

    const weekDates = getWeekDates();

    return (
      <div className="week-view">
        <div className="week-header">
          {weekDates.map((date, index) => {
            const today = isToday(date);
            return (
              <div 
                key={index} 
                className={`day-header-cell ${today ? 'today' : ''} ${date.getDay() === 0 || date.getDay() === 6 ? 'weekend' : ''}`}
              >
                <div className="weekday-name">
                  {date.toLocaleDateString('es-ES', { weekday: 'short' })}
                </div>
                <div className="weekday-date">
                  {date.getDate()}
                </div>
                {today && <div className="today-indicator">●</div>}
              </div>
            );
          })}
        </div>
        
        <div className="week-grid">
          {weekDates.map((date, dayIndex) => {
            // CORRECCIÓN: Usar areDatesEqual para comparar
            const dayEvents = events.filter(event => 
              areDatesEqual(event.event_date, date)
            );
            
            return (
              <div key={dayIndex} className="week-day-column">
                <div className="day-events-container">
                  {dayEvents.length === 0 ? (
                    <div className="no-events-day">
                      <span className="no-events-icon">✨</span>
                      <p>Sin eventos</p>
                    </div>
                  ) : (
                    dayEvents.map((event, eventIndex) => {
                      const eventType = EVENT_TYPES.find(t => t.id === event.event_type);
                      const daysUntil = calculateDaysUntil(event.event_date);
                      
                      return (
                        <div 
                          key={event.id}
                          className="week-event-card"
                          style={{ borderColor: eventType?.color }}
                          onClick={() => setSelectedEvent(event)}
                        >
                          <div className="week-event-header">
                            <span className="event-time-icon">{eventType?.icon}</span>
                            <span className="event-title">{event.title}</span>
                          </div>
                          <div className="week-event-details">
                            <div className="event-importance">
                              {'❤️'.repeat(event.importance)}
                            </div>
                            {daysUntil === 0 && (
                              <span className="event-today-badge">¡Hoy!</span>
                            )}
                          </div>
                          {event.description && (
                            <div className="event-description-preview">
                              {event.description.substring(0, 30)}...
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ================= COMPONENTE VISTA AÑO CORREGIDO =================
  const YearView = () => {
    const currentYear = currentDate.getFullYear();
    const months = Array.from({ length: 12 }, (_, i) => i);
    
    // Calcular eventos por mes
    const eventsByMonth = {};
    events.forEach(event => {
      const eventDate = toLocalDate(event.event_date);
      if (eventDate.getFullYear() === currentYear) {
        const month = eventDate.getMonth();
        if (!eventsByMonth[month]) eventsByMonth[month] = [];
        eventsByMonth[month].push(event);
      }
    });

    return (
      <div className="year-view">
        <div className="year-header">
          <h3>{currentYear} - Año de Amor</h3>
          <div className="year-stats">
            <span className="year-stat">
              📅 {events.filter(e => toLocalDate(e.event_date).getFullYear() === currentYear).length} eventos
            </span>
            <span className="year-stat">
              💖 {Math.floor(events.filter(e => toLocalDate(e.event_date).getFullYear() === currentYear).length / 30)} eventos/mes
            </span>
          </div>
        </div>
        
        <div className="year-grid">
          {months.map(month => {
            const monthEvents = eventsByMonth[month] || [];
            const monthName = new Date(currentYear, month).toLocaleDateString('es-ES', { month: 'long' });
            const today = new Date();
            const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === month;
            
            return (
              <div 
                key={month} 
                className={`month-cell ${isCurrentMonth ? 'current-month' : ''}`}
                onClick={() => {
                  setCurrentDate(createLocalDate(currentYear, month, 1));
                  setView('month');
                }}
              >
                <div className="month-header">
                  <h4>{monthName.charAt(0).toUpperCase() + monthName.slice(1)}</h4>
                  <span className="month-event-count">{monthEvents.length}</span>
                </div>
                
                <div className="month-events-preview">
                  {monthEvents.slice(0, 2).map(event => {
                    const eventType = EVENT_TYPES.find(t => t.id === event.event_type);
                    return (
                      <div 
                        key={event.id}
                        className="year-event-item"
                        style={{ backgroundColor: `${eventType?.color}20` }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(event);
                        }}
                      >
                        <span className="event-dot" style={{ backgroundColor: eventType?.color }}></span>
                        <span className="event-day">{toLocalDate(event.event_date).getDate()}</span>
                        <span className="event-title-preview">{event.title}</span>
                      </div>
                    );
                  })}
                  
                  {monthEvents.length > 2 && (
                    <div 
                      className="more-month-events"
                      onClick={(e) => {
                        e.stopPropagation();
                        const eventList = monthEvents.map(e => `• ${e.title} (${toLocalDate(e.event_date).getDate()})`).join('\n');
                        alert(`Eventos de ${monthName}:\n${eventList}`);
                      }}
                    >
                      +{monthEvents.length - 2} eventos más
                    </div>
                  )}
                  
                  {monthEvents.length === 0 && (
                    <div className="no-month-events">
                      <span className="no-events-icon">💭</span>
                      <p>Sin eventos</p>
                    </div>
                  )}
                </div>
                
                <div className="month-summary">
                  {EVENT_TYPES.map(type => {
                    const count = monthEvents.filter(e => e.event_type === type.id).length;
                    return count > 0 ? (
                      <span key={type.id} className="event-type-count" title={type.name}>
                        {type.icon} {count}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="year-legend">
          <div className="legend-title">Leyenda del Año:</div>
          <div className="legend-items">
            {EVENT_TYPES.map(type => (
              <div key={type.id} className="legend-item">
                <span className="legend-color" style={{ backgroundColor: type.color }}></span>
                <span className="legend-text">{type.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ================= MANEJAR NAVEGACIÓN =================
  const handlePrev = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (view === 'year') {
      newDate.setFullYear(newDate.getFullYear() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (view === 'year') {
      newDate.setFullYear(newDate.getFullYear() + 1);
    }
    setCurrentDate(newDate);
  };

  // ================= TÍTULO DE VISTA =================
  const getViewTitle = () => {
    switch(view) {
      case 'month':
        return currentDate.toLocaleDateString('es-ES', { 
          month: 'long', 
          year: 'numeric' 
        }).toUpperCase();
      case 'week':
        const startOfWeek = toLocalDate(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        return `${startOfWeek.getDate()} - ${endOfWeek.getDate()} de ${endOfWeek.toLocaleDateString('es-ES', { month: 'long' })} ${endOfWeek.getFullYear()}`;
      case 'year':
        return `AÑO ${currentDate.getFullYear()}`;
      default:
        return '';
    }
  };

  // ================= PANTALLA DE VERIFICACIÓN =================
  if (!isCodeVerified) {
    return (
      <div className="calendar-verification">
        <div className="verification-card">
          <h2>📅 Calendario de Recuerdos</h2>
          <p className="subtitle">Marca todas las fechas importantes de vuestra relación</p>
          
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
              🔓 Acceder al Calendario
            </button>
          </div>
          
          <div className="features-preview">
            <h4>✨ Lo que podrás hacer:</h4>
            <ul className="features-list">
              <li>🎂 Registrar cumpleaños y aniversarios</li>
              <li>⭐ Marcar fechas importantes</li>
              <li>🔔 Recibir recordatorios</li>
              <li>📊 Ver estadísticas</li>
              <li>🎁 Llevar registro de momentos especiales</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // ================= VARIABLES PARA RENDER =================
  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="memories-container">
      <Background />
      {/* ENCABEZADO */}
      <div className="memories-header">
        <h1>
          <span className="header-icon">📅</span>
          Nuestro Calendario de Amor
          <span className="header-icon">💖</span>
        </h1>
        <p className="subtitle">Cada fecha es un capítulo de nuestra historia</p>
        
        {/* ESTADÍSTICAS */}
        <div className="memories-stats">
          <div className="stat-card">
            <span className="stat-icon">📅</span>
            <span className="stat-number">{events.length}</span>
            <span className="stat-label">fechas importantes</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">🎂</span>
            <span className="stat-number">
              {events.filter(e => e.event_type === 'birthday').length}
            </span>
            <span className="stat-label">cumpleaños</span>
          </div>
          <div className="stat-card">
            <span className="stat-icon">💘</span>
            <span className="stat-number">
              {events.filter(e => e.event_type === 'anniversary').length}
            </span>
            <span className="stat-label">aniversarios</span>
          </div>
        </div>
      </div>

      {/* CONTROLES */}
      <div className="memories-controls">
        <div className="view-controls">
          <button 
            className={`view-btn ${view === 'month' ? 'active' : ''}`}
            onClick={() => setView('month')}
          >
            📅 Mes
          </button>
          <button 
            className={`view-btn ${view === 'week' ? 'active' : ''}`}
            onClick={() => setView('week')}
          >
            📆 Semana
          </button>
          <button 
            className={`view-btn ${view === 'year' ? 'active' : ''}`}
            onClick={() => setView('year')}
          >
            📊 Año
          </button>
        </div>
        
        <button 
          className="add-event-btn"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <span className="btn-icon">➕</span>
          Agregar Fecha Importante
        </button>
      </div>

      {/* CONTENEDOR DE VISTAS */}
      <div className="calendar-main">
        {/* ENCABEZADO DE NAVEGACIÓN */}
        <div className="view-header">
          <button 
            className="nav-btn"
            onClick={handlePrev}
            title={view === 'month' ? 'Mes anterior' : view === 'week' ? 'Semana anterior' : 'Año anterior'}
          >
            ◀
          </button>
          
          <h2 className="current-view-title">
            {getViewTitle()}
          </h2>
          
          <button 
            className="nav-btn"
            onClick={handleNext}
            title={view === 'month' ? 'Mes siguiente' : view === 'week' ? 'Semana siguiente' : 'Año siguiente'}
          >
            ▶
          </button>
        </div>

        {/* VISTA ACTUAL */}
        <div className="view-container">
          {view === 'month' && <MonthView />}
          {view === 'week' && <WeekView />}
          {view === 'year' && <YearView />}
        </div>
      </div>

      {/* PRÓXIMOS EVENTOS (solo se muestra en vistas mes y semana) */}
      {(view === 'month' || view === 'week') && (
        <div className="upcoming-section">
          <h3>🔔 Próximos Eventos</h3>
          {upcomingEvents.length === 0 ? (
            <p className="no-events">No hay eventos próximos</p>
          ) : (
            <div className="upcoming-list">
              {upcomingEvents.map(event => {
                const eventType = EVENT_TYPES.find(t => t.id === event.event_type);
                const daysUntil = calculateDaysUntil(event.event_date);
                
                return (
                  <div 
                    key={event.id}
                    className="upcoming-card"
                    style={{ borderLeftColor: eventType.color }}
                    onClick={() => setSelectedEvent(event)}
                  >
                    <div className="upcoming-header">
                      <span className="event-type-icon">{eventType.icon}</span>
                      <h4>{event.title}</h4>
                      <span className="importance">
                        {'❤️'.repeat(event.importance)}
                      </span>
                    </div>
                    
                    <div className="upcoming-details">
                      <div className="event-date">
                        <span className="date-icon">📅</span>
                        {formatDateDisplay(event.event_date)}
                      </div>
                      
                      {daysUntil > 0 ? (
                        <div className="countdown">
                          <span className="countdown-icon">⏳</span>
                          {daysUntil === 1 ? '¡Mañana!' : `Faltan ${daysUntil} días`}
                        </div>
                      ) : (
                        <div className="countdown today">
                          <span className="countdown-icon">🎉</span>
                          ¡Hoy es el día!
                        </div>
                      )}
                      
                      {event.location && (
                        <div className="event-location">
                          <span className="location-icon">📍</span>
                          {event.location}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EVENTOS POR TIPO (solo se muestra en vista año) */}
      {view === 'year' && (
        <div className="events-by-type">
          <h3>📊 Eventos por Tipo - {currentDate.getFullYear()}</h3>
          <div className="type-cards">
            {EVENT_TYPES.map(type => {
              const typeEvents = events.filter(e => {
                const eventDate = toLocalDate(e.event_date);
                return e.event_type === type.id && eventDate.getFullYear() === currentDate.getFullYear();
              });
              return (
                <div 
                  key={type.id}
                  className="type-card"
                  style={{ backgroundColor: `${type.color}20` }}
                  onClick={() => {
                    const eventList = typeEvents.map(e => `• ${e.title} (${formatDateDisplay(e.event_date)})`).join('\n');
                    alert(`${type.name} - ${typeEvents.length} eventos:\n${eventList || 'No hay eventos'}`);
                  }}
                >
                  <div className="type-card-header">
                    <span className="type-card-icon">{type.icon}</span>
                    <span className="type-card-name">{type.name}</span>
                  </div>
                  <div className="type-card-count">{typeEvents.length}</div>
                  <div className="type-card-description">
                    {typeEvents.length === 0 ? 'Sin eventos' : 
                     typeEvents.length === 1 ? '1 evento' : `${typeEvents.length} eventos`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DETALLE DE EVENTO SELECCIONADO */}
      {selectedEvent && (
        <div className="event-detail-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="event-detail-card" onClick={(e) => e.stopPropagation()}>
            <div className="event-detail-header">
              <button className="close-detail-btn" onClick={() => setSelectedEvent(null)}>✕</button>
              <div className="event-detail-title">
                <span className="detail-icon">
                  {EVENT_TYPES.find(t => t.id === selectedEvent.event_type)?.icon}
                </span>
                <h3>{selectedEvent.title}</h3>
              </div>
            </div>
            
            <div className="event-detail-content">
              <div className="detail-section">
                <div className="detail-label">📅 Fecha:</div>
                <div className="detail-value">
                  {formatDateDisplay(selectedEvent.event_date)}
                  {isToday(selectedEvent.event_date) && (
                    <span style={{ color: '#FF3366', fontWeight: 'bold', marginLeft: '10px' }}>
                      🎉 ¡HOY!
                    </span>
                  )}
                </div>
              </div>
              
              {selectedEvent.location && (
                <div className="detail-section">
                  <div className="detail-label">📍 Lugar:</div>
                  <div className="detail-value">{selectedEvent.location}</div>
                </div>
              )}
              
              {selectedEvent.description && (
                <div className="detail-section">
                  <div className="detail-label">📝 Descripción:</div>
                  <div className="detail-value">{selectedEvent.description}</div>
                </div>
              )}
              
              <div className="detail-section">
                <div className="detail-label">💖 Importancia:</div>
                <div className="detail-value importance-display">
                  {'❤️'.repeat(selectedEvent.importance)}
                  <span className="importance-text">
                    ({IMPORTANCE_LEVELS.find(l => l.value === selectedEvent.importance)?.label})
                  </span>
                </div>
              </div>
              
              <div className="detail-section">
                <div className="detail-label">🔄 Repetición:</div>
                <div className="detail-value">
                  {selectedEvent.repeat_yearly ? '✅ Se repite cada año' : '❌ No se repite'}
                </div>
              </div>
            </div>
            
            <div className="event-detail-footer">
              <div className="detail-actions">
                <button 
                  className="edit-event-btn"
                  onClick={() => openEditForm(selectedEvent)}
                >
                  ✏️ Editar Evento
                </button>
                <button 
                  className="delete-event-btn"
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
                      handleDeleteEvent(selectedEvent.id);
                    }
                  }}
                  style={{
                    marginLeft: '15px',
                    background: 'linear-gradient(135deg, #f44336 0%, #c62828 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px 25px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FORMULARIO FLOTANTE */}
      {showForm && (
        <div className="form-overlay" onClick={() => {
          setShowForm(false);
          resetForm();
        }}>
          <div className="event-form-container" onClick={(e) => e.stopPropagation()}>
            <EventForm 
              newEvent={newEvent}
              setNewEvent={setNewEvent}
              onClose={() => {
                setShowForm(false);
                resetForm();
              }}
              onSubmit={isEditing ? handleUpdateEvent : handleAddEvent}
              EVENT_TYPES={EVENT_TYPES}
              IMPORTANCE_LEVELS={IMPORTANCE_LEVELS}
              formatDateForInput={formatDateForInput}
              isEditing={isEditing}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// ================= COMPONENTE FORMULARIO ACTUALIZADO =================
const EventForm = ({ newEvent, setNewEvent, onClose, onSubmit, EVENT_TYPES, IMPORTANCE_LEVELS, formatDateForInput, isEditing }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) {
      alert('Por favor ingresa un título para el evento');
      return;
    }
    onSubmit(newEvent);
  };

  return (
    <div className="event-form">
      <div className="form-header">
        <h3>{isEditing ? '✏️ Editar Fecha Importante' : '➕ Agregar Fecha Importante'}</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Título del evento:</label>
          <input
            type="text"
            value={newEvent.title}
            onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
            placeholder="Ej: Cumpleaños, Aniversario, Viaje..."
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Tipo de evento:</label>
          <div className="type-selector">
            {EVENT_TYPES.map(type => (
              <button
                key={type.id}
                type="button"
                className={`type-option ${newEvent.event_type === type.id ? 'selected' : ''}`}
                style={{ borderColor: type.color }}
                onClick={() => setNewEvent({...newEvent, event_type: type.id})}
              >
                <span className="option-icon">{type.icon}</span>
                <span className="option-name">{type.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Fecha:</label>
            <input
              type="date"
              value={newEvent.event_date}
              onChange={(e) => setNewEvent({...newEvent, event_date: e.target.value})}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Importancia:</label>
            <div className="importance-selector">
              {IMPORTANCE_LEVELS.map(level => (
                <button
                  key={level.value}
                  type="button"
                  className={`importance-option ${newEvent.importance === level.value ? 'selected' : ''}`}
                  onClick={() => setNewEvent({...newEvent, importance: level.value})}
                  title={level.label}
                >
                  {level.hearts}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>Descripción (opcional):</label>
          <textarea
            value={newEvent.description}
            onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
            placeholder="Describe este momento especial..."
            rows="3"
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={newEvent.repeat_yearly}
              onChange={(e) => setNewEvent({...newEvent, repeat_yearly: e.target.checked})}
              className="form-checkbox"
            />
            <span>🔁 Repetir automáticamente cada año</span>
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="submit-btn">
            {isEditing ? 'Actualizar Evento' : 'Guardar en el Calendario'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Memories;