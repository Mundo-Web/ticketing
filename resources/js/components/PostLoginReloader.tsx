// components/PostLoginReloader.tsx
/**
 * Componente que detecta login reciente y recarga la página
 * para actualizar CSRF tokens automáticamente
 */
import { useEffect } from 'react';

export default function PostLoginReloader() {
    useEffect(() => {
        // Solo ejecutar en el navegador
        if (typeof window === 'undefined') return;

        // Verificar si acabamos de hacer login
        const justLoggedIn = sessionStorage.getItem('just-logged-in');
        const loginTimestamp = sessionStorage.getItem('login-timestamp');
        
        if (justLoggedIn === 'true' && loginTimestamp) {
            const timeSinceLogin = Date.now() - parseInt(loginTimestamp);
            
            // Si el login fue hace menos de 5 segundos, recargar la página
            if (timeSinceLogin < 5000) {
                console.log('🔄 [PostLoginReloader] Detectado login reciente, recargando para actualizar CSRF tokens...');
                
                // Limpiar las flags
                sessionStorage.removeItem('just-logged-in');
                sessionStorage.removeItem('login-timestamp');
                
                // Mostrar notificación si toast está disponible
                if ((window as any).toast) {
                    (window as any).toast.success('¡Bienvenido! Actualizando sesión...');
                }
                
                // Recargar después de un breve delay
                setTimeout(() => {
                    window.location.reload();
                }, 800);
                
                return;
            }
        }
        
        // Limpiar flags antiguas (más de 5 segundos)
        if (justLoggedIn && loginTimestamp) {
            const timeSinceLogin = Date.now() - parseInt(loginTimestamp);
            if (timeSinceLogin > 5000) {
                sessionStorage.removeItem('just-logged-in');
                sessionStorage.removeItem('login-timestamp');
            }
        }
    }, []);

    // Este componente no renderiza nada
    return null;
}