// utils/auth-csrf-handler.js
/**
 * Manejo específico de CSRF después del login
 * Detecta login exitoso y recarga la página automáticamente
 */

export function setupPostLoginCSRFHandler() {
    if (typeof window === 'undefined') return;

    // Detectar login exitoso mediante cambios en la página
    if (window.router) {
        window.router.on('success', (event) => {
            const currentUrl = window.location.pathname;
            const previousUrl = document.referrer;
            
            console.log('[AUTH-CSRF] Navigation detected:', {
                from: previousUrl,
                to: currentUrl,
                isFromLogin: previousUrl.includes('/login'),
                isNotLogin: !currentUrl.includes('/login')
            });
            
            // Si venimos de login y ahora estamos en cualquier otra página
            if (previousUrl.includes('/login') && !currentUrl.includes('/login')) {
                console.log('[AUTH-CSRF] ✅ Login exitoso detectado - Recargando para actualizar CSRF tokens...');
                
                // Mostrar notificación
                showLoginSuccessNotification();
                
                // Recargar después de un breve delay
                setTimeout(() => {
                    console.log('[AUTH-CSRF] 🔄 Recargando página...');
                    window.location.reload();
                }, 1000);
                
                return;
            }
            
            // También detectar si hay cambio de usuario en la página
            const authMeta = document.querySelector('meta[name="user-id"]');
            if (authMeta) {
                const userId = authMeta.getAttribute('content');
                const storedUserId = sessionStorage.getItem('current-user-id');
                
                if (storedUserId && storedUserId !== userId) {
                    console.log('[AUTH-CSRF] ✅ Cambio de usuario detectado - Actualizando sesión...');
                    sessionStorage.setItem('current-user-id', userId);
                    
                    setTimeout(() => {
                        window.location.reload();
                    }, 800);
                }
                
                // Guardar el ID del usuario actual
                if (!storedUserId && userId) {
                    sessionStorage.setItem('current-user-id', userId);
                }
            }
        });
    }
    
    // Detectar login exitoso mediante localStorage/sessionStorage
    window.addEventListener('storage', (e) => {
        if (e.key === 'auth-status' && e.newValue === 'logged-in') {
            console.log('[AUTH-CSRF] ✅ Login detectado via storage - Actualizando...');
            setTimeout(() => {
                window.location.reload();
            }, 800);
        }
    });
}

/**
 * Mostrar notificación de login exitoso
 */
function showLoginSuccessNotification() {
    // Usar toast si está disponible
    if (typeof window !== 'undefined' && window.toast) {
        window.toast.success('¡Login exitoso! Actualizando sesión...', {
            duration: 2000
        });
        return;
    }

    // Fallback: notificación visual
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        animation: slideInRight 0.3s ease-out;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <div style="width: 16px; height: 16px; border-radius: 50%; background: rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center;">
                ✓
            </div>
            <span>¡Login exitoso! Actualizando sesión...</span>
        </div>
    `;
    
    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 2500);
}

// Auto-inicializar
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(setupPostLoginCSRFHandler, 100);
    });
}

// CSS para animación
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}