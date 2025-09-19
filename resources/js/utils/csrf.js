// utils/csrf.js
/**
 * Actualizar meta tag de CSRF token
 */
export function updateCSRFToken(token) {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    if (metaTag) {
        metaTag.setAttribute('content', token);
    }
    
    // También actualizar axios si está disponible
    if (window.axios) {
        window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
    }
}

/**
 * Obtener token CSRF fresco del servidor
 */
export async function refreshCSRFToken() {
    try {
        const response = await fetch('/csrf-token', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.csrf_token) {
                updateCSRFToken(data.csrf_token);
                return data.csrf_token;
            }
        }
    } catch (error) {
        console.error('Error refreshing CSRF token:', error);
    }
    return null;
}

/**
 * Configurar auto-refresh del token CSRF cada 30 minutos
 */
export function setupCSRFAutoRefresh() {
    // Refrescar cada 30 minutos
    setInterval(async () => {
        await refreshCSRFToken();
    }, 30 * 60 * 1000);
}

/**
 * Interceptar errores 419 y refrescar token automáticamente
 */
export function setupCSRFErrorHandler() {
    // Interceptor para Axios si está disponible
    if (window.axios) {
        window.axios.interceptors.response.use(
            response => response,
            async error => {
                if (error.response?.status === 419) {
                    console.log('CSRF token expired, refreshing...');
                    const newToken = await refreshCSRFToken();
                    if (newToken) {
                        // Reintentar la request original con el nuevo token
                        error.config.headers['X-CSRF-TOKEN'] = newToken;
                        return window.axios.request(error.config);
                    }
                }
                return Promise.reject(error);
            }
        );
    }
    
    // Interceptor para fetch
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        let response = await originalFetch.apply(this, args);
        
        if (response.status === 419) {
            console.log('CSRF token expired, refreshing...');
            const newToken = await refreshCSRFToken();
            if (newToken) {
                // Actualizar headers de la request original
                const [url, options = {}] = args;
                const newOptions = {
                    ...options,
                    headers: {
                        ...options.headers,
                        'X-CSRF-TOKEN': newToken
                    }
                };
                response = await originalFetch(url, newOptions);
            }
        }
        
        return response;
    };
}