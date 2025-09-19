// utils/csrf-helper.js
/**
 * Utilidad para manejo automático de CSRF tokens
 * Compatible con el patrón actual del proyecto
 */

/**
 * Obtener el token CSRF actual del DOM
 */
export function getCSRFToken() {
    const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (!token) {
        console.warn('[CSRF] No se encontró token CSRF en el meta tag');
    }
    return token || '';
}

/**
 * Crear headers con CSRF token automáticamente
 */
export function createCSRFHeaders(additionalHeaders = {}) {
    return {
        'X-CSRF-TOKEN': getCSRFToken(),
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...additionalHeaders
    };
}

/**
 * Wrapper para Inertia router que incluye CSRF automáticamente
 */
export function createInertiaConfig(config = {}) {
    return {
        preserveScroll: true,
        headers: {
            'X-CSRF-TOKEN': getCSRFToken(),
            ...config.headers
        },
        ...config
    };
}

/**
 * Wrapper para fetch que incluye CSRF automáticamente
 */
export async function csrfFetch(url, options = {}) {
    const csrfHeaders = createCSRFHeaders(options.headers);
    
    const response = await fetch(url, {
        ...options,
        headers: csrfHeaders
    });

    // Manejar errores CSRF automáticamente
    if (response.status === 419) {
        console.warn('[CSRF] Token expirado, recargando página...');
        showCSRFErrorNotification();
        setTimeout(() => window.location.reload(), 1000);
        throw new Error('CSRF token expired');
    }

    return response;
}

/**
 * Mostrar notificación de error CSRF
 */
function showCSRFErrorNotification() {
    // Usar toast si está disponible
    if (typeof window !== 'undefined' && window.toast) {
        window.toast.error('Session expired. Reloading page...');
        return;
    }

    // Fallback: notificación visual simple
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = 'Session expired. Reloading page...';
    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

/**
 * Detectar y manejar cambios de autenticación
 */
function setupAuthenticationWatcher() {
    let lastAuthState = document.querySelector('meta[name="user-authenticated"]')?.getAttribute('content');
    
    // Detectar cambios en el estado de autenticación
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.target.name === 'user-authenticated') {
                const currentAuthState = mutation.target.getAttribute('content');
                
                if (lastAuthState !== currentAuthState && currentAuthState === 'true') {
                    console.log('[CSRF] Login detectado, recargando página para actualizar tokens...');
                    setTimeout(() => {
                        window.location.reload();
                    }, 500);
                }
                
                lastAuthState = currentAuthState;
            }
        });
    });

    // Observar cambios en meta tags
    const metaTags = document.querySelectorAll('meta');
    metaTags.forEach(meta => {
        observer.observe(meta, { attributes: true });
    });
}

/**
 * Configurar interceptores globales para Inertia
 */
export function setupGlobalCSRFHandling() {
    // Solo ejecutar en el navegador
    if (typeof window === 'undefined') return;

    // Configurar watcher de autenticación
    setupAuthenticationWatcher();

    // Detectar navegación exitosa después de login
    if (window.router) {
        window.router.on('success', (event) => {
            const url = event.detail?.page?.url || window.location.pathname;
            
            // Si venimos de login y ahora estamos en dashboard u otra página
            if (document.referrer.includes('/login') && !url.includes('/login')) {
                console.log('[CSRF] Login exitoso detectado, actualizando tokens...');
                
                // Mostrar notificación de éxito
                if (typeof window !== 'undefined' && window.toast) {
                    window.toast.success('Login successful! Updating session...');
                }
                
                // Pequeño delay y recarga para asegurar tokens frescos
                setTimeout(() => {
                    window.location.reload();
                }, 800);
            }
        });

        // Interceptar errores de Inertia
        window.router.on('error', (event) => {
            const errors = event.detail?.errors;
            
            if (errors?.status === 419 || 
                (typeof errors === 'object' && errors?.message?.includes('CSRF')) ||
                (typeof errors === 'string' && errors.includes('419'))) {
                
                console.warn('[CSRF] Error 419 detectado, recargando página...');
                showCSRFErrorNotification();
                
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                
                event.preventDefault();
                return false;
            }
        });

        // Interceptar requests para agregar token automáticamente
        window.router.on('before', (event) => {
            if (event.detail?.visit?.headers) {
                const token = getCSRFToken();
                if (token) {
                    event.detail.visit.headers['X-CSRF-TOKEN'] = token;
                }
            }
        });
    }
}

// Auto-inicializar cuando se carga el módulo
if (typeof window !== 'undefined') {
    // Esperar a que Inertia esté disponible
    document.addEventListener('DOMContentLoaded', () => {
        // Pequeño delay para asegurar que Inertia esté cargado
        setTimeout(setupGlobalCSRFHandling, 100);
    });
}

export default {
    getCSRFToken,
    createCSRFHeaders,
    createInertiaConfig,
    csrfFetch,
    setupGlobalCSRFHandling
};