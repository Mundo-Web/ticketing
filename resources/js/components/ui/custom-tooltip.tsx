import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CustomTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  delay?: number;
  className?: string;
}

export function CustomTooltip({ 
  content, 
  children, 
  position = 'top', 
  variant = 'default',
  delay = 300,
  className 
}: CustomTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPosition, setActualPosition] = useState(position);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  const variantStyles = {
    default: 'bg-gray-900 text-white border-gray-700',
    success: 'bg-green-600 text-white border-green-500',
    warning: 'bg-amber-600 text-white border-amber-500',
    error: 'bg-red-600 text-white border-red-500',
    info: 'bg-blue-600 text-white border-blue-500'
  };

  const arrowStyles = {
    default: 'border-t-gray-900',
    success: 'border-t-green-600',
    warning: 'border-t-amber-600',
    error: 'border-t-red-600',
    info: 'border-t-blue-600'
  };

  const positionStyles = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };

  const arrowPositionStyles = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900'
  };

  // Función para detectar si el tooltip se sale de la pantalla y ajustar posición
  useEffect(() => {
    if (isVisible && tooltipRef.current && triggerRef.current) {
      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      let newPosition = position;

      // Verificar si se sale por los lados
      if (rect.left < 10) {
        newPosition = 'right';
      } else if (rect.right > viewport.width - 10) {
        newPosition = 'left';
      }

      // Verificar si se sale por arriba o abajo
      if (rect.top < 10) {
        newPosition = 'bottom';
      } else if (rect.bottom > viewport.height - 10) {
        newPosition = 'top';
      }

      setActualPosition(newPosition);
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            'absolute z-50 px-3 py-2 text-sm font-medium rounded-lg shadow-lg border backdrop-blur-sm',
            'animate-in fade-in-0 zoom-in-95 duration-200',
            'max-w-xs break-words whitespace-normal',
            variantStyles[variant],
            positionStyles[actualPosition],
            className
          )}
        >
          {content}
          
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-0 h-0 border-4',
              arrowPositionStyles[actualPosition],
              actualPosition === 'top' && arrowStyles[variant],
              actualPosition === 'bottom' && 'border-b-gray-900',
              actualPosition === 'left' && 'border-l-gray-900',
              actualPosition === 'right' && 'border-r-gray-900'
            )}
            style={{
              borderTopColor: actualPosition === 'top' ? 
                (variant === 'default' ? '#1f2937' : 
                 variant === 'success' ? '#059669' :
                 variant === 'warning' ? '#d97706' :
                 variant === 'error' ? '#dc2626' : '#2563eb') : 'transparent',
              borderBottomColor: actualPosition === 'bottom' ? 
                (variant === 'default' ? '#1f2937' : 
                 variant === 'success' ? '#059669' :
                 variant === 'warning' ? '#d97706' :
                 variant === 'error' ? '#dc2626' : '#2563eb') : 'transparent',
              borderLeftColor: actualPosition === 'left' ? 
                (variant === 'default' ? '#1f2937' : 
                 variant === 'success' ? '#059669' :
                 variant === 'warning' ? '#d97706' :
                 variant === 'error' ? '#dc2626' : '#2563eb') : 'transparent',
              borderRightColor: actualPosition === 'right' ? 
                (variant === 'default' ? '#1f2937' : 
                 variant === 'success' ? '#059669' :
                 variant === 'warning' ? '#d97706' :
                 variant === 'error' ? '#dc2626' : '#2563eb') : 'transparent'
            }}
          />
        </div>
      )}
    </div>
  );
}
