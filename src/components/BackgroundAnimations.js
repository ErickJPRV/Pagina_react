// components/BackgroundAnimations.js
import React, { useEffect, useState } from 'react';
import './BackgroundAnimations.css';

// Registro de animaciones para cada componente
const animationsRegistry = {
  // Animaciones predefinidas que pueden ser reutilizadas
  predefined: {
    hearts: {
      elements: ['❤️', '💖', '💕', '💗', '💓', '💞', '💝'],
      count: 20,
      animation: 'float-heart',
      speed: 'medium',
      opacity: 0.4
    },
    stars: {
      elements: ['⭐', '🌟', '✨', '💫', '☀️'],
      count: 15,
      animation: 'twinkle',
      speed: 'slow',
      opacity: 0.3
    },
    flowers: {
      elements: ['🌸', '🌺', '🌼', '🌷', '🌹', '💐'],
      count: 12,
      animation: 'float-rotate',
      speed: 'medium',
      opacity: 0.35
    },
    music: {
      elements: ['🎵', '🎶', '🎼', '🎹', '🎻', '🎺'],
      count: 10,
      animation: 'bounce',
      speed: 'fast',
      opacity: 0.4
    },
    travel: {
      elements: ['✈️', '🚗', '🚂', '🚲', '🗺️', '📍'],
      count: 8,
      animation: 'travel-move',
      speed: 'slow',
      opacity: 0.3
    }
  },
  
  // Animaciones específicas por componente
  components: {
    gallery: {
      name: 'gallery',
      elements: ['📸', '🖼️', '🎞️', '🌟', '✨', '💖', '📷', '🎨'],
      count: 18,
      animation: 'gallery-float',
      speed: 'medium',
      opacity: 0.35,
      lines: true,
      linesType: 'photo-frame',
      backgroundColor: 'linear-gradient(135deg, rgba(255, 240, 245, 0.95) 0%, rgba(248, 244, 255, 0.95) 100%)'
    },
    
    timeline: {
      name: 'timeline',
      elements: ['📅', '📌', '📍', '⏳', '⌛', '💝', '📜', '🎯', '🏆'],
      count: 16,
      animation: 'timeline-float',
      speed: 'slow',
      opacity: 0.4,
      lines: true,
      linesType: 'timeline',
      backgroundColor: 'linear-gradient(135deg, rgba(240, 248, 255, 0.95) 0%, rgba(248, 240, 255, 0.95) 100%)'
    },
    
    letter: {
      name: 'letter',
      elements: ['💌', '✉️', '📝', '✏️', '🖋️', '📜', '💝', '💕', '📮'],
      count: 22,
      animation: 'letter-float',
      speed: 'medium',
      opacity: 0.3,
      lines: true,
      linesType: 'writing',
      backgroundColor: 'linear-gradient(135deg, rgba(255, 250, 240, 0.95) 0%, rgba(245, 240, 255, 0.95) 100%)'
    },
    
    memories: {
      name: 'memories',
      elements: ['📆', '⭐', '🌟', '✨', '🎁', '🎂', '💘', '💞', '🎉', '📊'],
      count: 20,
      animation: 'memory-float',
      speed: 'medium',
      opacity: 0.4,
      lines: true,
      linesType: 'calendar',
      backgroundColor: 'linear-gradient(135deg, rgba(240, 248, 255, 0.95) 0%, rgba(248, 240, 255, 0.95) 100%)'
    }
  }
};

const BackgroundAnimations = ({ component, customConfig = null }) => {
  const [elements, setElements] = useState([]);
  const [lines, setLines] = useState([]);

  // Obtener configuración de animación
  const getAnimationConfig = () => {
    if (customConfig) return customConfig;
    
    if (animationsRegistry.components[component]) {
      return animationsRegistry.components[component];
    }
    
    // Configuración por defecto si el componente no está registrado
    return {
      name: 'default',
      elements: ['💖', '💕', '💗', '💓'],
      count: 12,
      animation: 'float-default',
      speed: 'medium',
      opacity: 0.3,
      lines: false,
      backgroundColor: 'linear-gradient(135deg, rgba(255, 245, 250, 0.95) 0%, rgba(250, 245, 255, 0.95) 100%)'
    };
  };

  const config = getAnimationConfig();

  useEffect(() => {
    // Crear elementos flotantes
    const createElements = () => {
      const newElements = [];
      const speedMap = {
        'slow': { duration: 10, delay: 0 },
        'medium': { duration: 7, delay: 0 },
        'fast': { duration: 4, delay: 0 }
      };
      
      const speed = speedMap[config.speed] || speedMap.medium;

      for (let i = 0; i < config.count; i++) {
        newElements.push({
          id: `${component}-${Date.now()}-${i}`,
          type: config.elements[Math.floor(Math.random() * config.elements.length)],
          left: Math.random() * 100,
          top: Math.random() * 100,
          size: Math.random() * 25 + 15,
          duration: speed.duration + Math.random() * 3,
          delay: Math.random() * 5,
          rotation: Math.random() * 20 - 10,
          opacity: config.opacity + Math.random() * 0.2 - 0.1
        });
      }
      
      setElements(newElements);
    };

    // Crear líneas decorativas si están configuradas
    const createLines = () => {
      if (!config.lines) return;
      
      const linesCount = 3;
      const newLines = [];
      
      for (let i = 0; i < linesCount; i++) {
        newLines.push({
          id: `${component}-line-${i}`,
          top: 20 + (i * 25),
          width: 30 + (i * 15),
          delay: i * 2,
          type: config.linesType
        });
      }
      
      setLines(newLines);
    };

    createElements();
    createLines();

    // Actualizar elementos periódicamente para variedad
    const interval = setInterval(() => {
      createElements();
    }, 20000); // Cada 20 segundos

    return () => clearInterval(interval);
  }, [component, config]);

  if (!component) return null;

  return (
    <div 
      className={`background-animation ${component}-background`}
      style={{ background: config.backgroundColor }}
    >
      {/* Elementos flotantes */}
      <div className="floating-container">
        {elements.map(element => (
          <div
            key={element.id}
            className={`floating-element ${config.animation}`}
            style={{
              left: `${element.left}%`,
              top: `${element.top}%`,
              fontSize: `${element.size}px`,
              animationDuration: `${element.duration}s`,
              animationDelay: `${element.delay}s`,
              opacity: element.opacity,
              transform: `rotate(${element.rotation}deg)`
            }}
          >
            {element.type}
          </div>
        ))}
      </div>

      {/* Líneas decorativas */}
      {config.lines && (
        <div className={`decorative-lines ${config.linesType}-lines`}>
          {lines.map(line => (
            <div
              key={line.id}
              className={`decorative-line ${line.type}-line`}
              style={{
                top: `${line.top}%`,
                width: `${line.width}%`,
                animationDelay: `${line.delay}s`
              }}
            />
          ))}
        </div>
      )}

      {/* Efectos de brillo */}
      <div className="glow-effects">
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>
        <div className="glow glow-3"></div>
      </div>
    </div>
  );
};

// Hook personalizado para que los componentes registren sus animaciones
export const useBackgroundAnimation = (componentName, customConfig = null) => {
  return {
    Background: () => <BackgroundAnimations component={componentName} customConfig={customConfig} />,
    registerCustomAnimation: (name, config) => {
      animationsRegistry.components[name] = config;
    }
  };
};

export default BackgroundAnimations;