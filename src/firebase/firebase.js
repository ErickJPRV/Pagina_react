// src/firebase/firebase.js
import { initializeApp } from 'firebase/app';
import { 
  getFirestore,
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
} from 'firebase/firestore';

// ⚠️ PEGA TU CONFIGURACIÓN AQUÍ ⚠️
// REEMPLAZA estos valores con los TUYOS de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDoH7rsmGIu2pfUUEtLcbztxjvOyCAaYf0",
  authDomain: "aniversario-app-98843.firebaseapp.com",
  projectId: "aniversario-app-98843",
  storageBucket: "aniversario-app-98843.firebasestorage.app",
  messagingSenderId: "1081724977409",
  appId: "1:1081724977409:web:24fe9fcea88ce60764db00"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore Database
const db = getFirestore(app);

// Exportar TODO lo necesario
export { 
  app, 
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
};

// Función para verificar conexión
export const testFirebaseConnection = async () => {
  try {
    console.log('🔥 Probando conexión a Firebase...');
    console.log('Proyecto:', firebaseConfig.projectId);
    console.log('App ID:', firebaseConfig.appId);
    
    // Probar conexión real intentando acceder a la base de datos
    const testCollection = collection(db, 'test_connection');
    await getDocs(testCollection);
    
    return { 
      success: true, 
      project: firebaseConfig.projectId,
      message: '✅ Firebase configurado correctamente' 
    };
  } catch (error) {
    console.error('❌ Error en Firebase:', error);
    
    // Si el error es por colección no existente, es normal
    if (error.code === 'failed-precondition' || error.code === 'not-found') {
      return { 
        success: true, 
        project: firebaseConfig.projectId,
        message: '✅ Firebase configurado, pero no hay colección de prueba' 
      };
    }
    
    return { 
      success: false, 
      error: error.message 
    };
  }
};