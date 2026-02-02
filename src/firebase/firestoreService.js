// src/firebase/firestoreService.js
// src/firebase/firestoreService.js
// Importar todo desde firebase.js
import { 
  db,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
} from './firebase'; // Esto ahora funcionará

// Resto del código permanece igual...
const timelineCollection = collection(db, 'timeline');

// ================= FUNCIONES PRINCIPALES =================
// 1. Obtener todos los eventos
export const getTimelineEvents = async () => {
  try {
    console.log('📡 Conectando a Firestore...');
    
    // Crear consulta ordenada por fecha
    const q = query(timelineCollection, orderBy('date', 'asc'));
    
    // Obtener documentos
    const querySnapshot = await getDocs(q);
    
    // Convertir a array de objetos
    const events = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id, // ID único de Firestore
        title: data.title || '',
        description: data.description || '',
        date: data.date || '',
        type: data.type || 'memory',
        icon: data.icon || '💕',
        imageUrl: data.imageUrl || '',
        color: data.color || '#ff6b8b',
        isImportant: data.isImportant || false,
        // Convertir timestamps de Firebase a strings
        createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.().toISOString() || new Date().toISOString()
      };
    });
    
    console.log(`✅ Cargados ${events.length} eventos de Firestore`);
    return events;
    
  } catch (error) {
    console.error('❌ Error obteniendo eventos:', error);
    console.error('Código de error:', error.code);
    console.error('Mensaje:', error.message);
    
    // Si hay error, devolver array vacío
    return [];
  }
};


// 2. Agregar nuevo evento
export const addTimelineEvent = async (eventData) => {
  try {
    console.log('📤 Subiendo evento a Firestore...', eventData);
    
    // Agregar documento a Firestore
    const docRef = await addDoc(timelineCollection, {
      ...eventData,
      createdAt: serverTimestamp(), // Timestamp de Firebase
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Evento guardado con ID:', docRef.id);
    
    return { 
      success: true, 
      id: docRef.id,
      message: 'Evento guardado en Firestore' 
    };
    
  } catch (error) {
    console.error('❌ Error agregando evento:', error);
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
    
    return { 
      success: false, 
      error: error.message,
      code: error.code 
    };
  }
};

// 3. Actualizar evento
export const updateTimelineEvent = async (id, updates) => {
  try {
    console.log('✏️ Actualizando evento:', id);
    
    // Referencia al documento
    const eventRef = doc(db, 'timeline', id);
    
    // Actualizar documento
    await updateDoc(eventRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Evento actualizado');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error actualizando evento:', error);
    return { success: false, error: error.message };
  }
};

// 4. Eliminar evento
export const deleteTimelineEvent = async (id) => {
  try {
    console.log('🗑️ Eliminando evento:', id);
    
    // Referencia al documento
    const eventRef = doc(db, 'timeline', id);
    
    // Eliminar documento
    await deleteDoc(eventRef);
    
    console.log('✅ Evento eliminado');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error eliminando evento:', error);
    return { success: false, error: error.message };
  }
};

// 5. Suscribirse a cambios en tiempo real
export const subscribeToTimelineUpdates = (callback) => {
  try {
    console.log('👂 Suscribiéndose a cambios en tiempo real...');
    
    // Crear consulta ordenada
    const q = query(timelineCollection, orderBy('date', 'asc'));
    
    // Escuchar cambios en tiempo real
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const events = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          description: data.description || '',
          date: data.date || '',
          type: data.type || 'memory',
          icon: data.icon || '💕',
          imageUrl: data.imageUrl || '',
          color: data.color || '#ff6b8b',
          isImportant: data.isImportant || false,
          createdAt: data.createdAt?.toDate?.().toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.().toISOString() || new Date().toISOString()
        };
      });
      
      console.log(`⚡ Cambio recibido: ${events.length} eventos`);
      callback(events);
      
    }, (error) => {
      console.error('❌ Error en suscripción:', error);
      // En caso de error, llamar callback con array vacío
      callback([]);
    });
    
    return unsubscribe;
    
  } catch (error) {
    console.error('❌ Error inicializando suscripción:', error);
    // Devolver función vacía para evitar errores
    return () => {};
  }
};

// 6. Verificar conexión
export const checkFirestoreConnection = async () => {
  try {
    // Intentar una consulta simple
    const testQuery = query(timelineCollection);
    const snapshot = await getDocs(testQuery);
    
    return { 
      connected: true, 
      message: `✅ Conectado a Firestore (${snapshot.size} documentos)`,
      projectId: db.app.options.projectId
    };
    
  } catch (error) {
    return { 
      connected: false, 
      message: `❌ Error: ${error.message}`,
      error: error.message 
    };
  }
};