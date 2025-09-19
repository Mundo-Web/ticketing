// utils/inertia-csrf.js
import { router } from '@inertiajs/react'

// Configurar Inertia para manejar CSRF automáticamente
export function setupInertiaCSRF() {
    // Interceptar todas las requests de Inertia para agregar CSRF token
    router.on('before', (event) => {
        const token = getCSRFToken()
        
        if (token && event.detail.visit) {
            // Asegurar que el header X-CSRF-TOKEN esté presente
            event.detail.visit.headers = {
                ...event.detail.visit.headers,
                'X-CSRF-TOKEN': token
            }
        }
    })

    // Manejar errores CSRF
    router.on('error', (event) => {
        if (event.detail.errors) {
            const errors = event.detail.errors
            
            // Si es error 419 o mensaje de CSRF
            if (errors.status === 419 || 
                (typeof errors === 'object' && errors.message?.includes('CSRF')) ||
                (typeof errors === 'string' && errors.includes('419'))) {
                
                console.warn('🔄 CSRF Error detected, reloading page...')
                
                // Mostrar notificación
                showNotification('Session expired. Reloading page...', 'warning')
                
                // Recargar página después de un momento
                setTimeout(() => {
                    window.location.reload()
                }, 1000)
                
                // Prevenir que el error se propague
                event.preventDefault()
                return false
            }
        }
    })
}

function getCSRFToken() {
    // Intentar obtener el token desde múltiples fuentes
    let token = null
    
    // 1. Desde meta tag
    const metaTag = document.querySelector('meta[name="csrf-token"]')
    if (metaTag) {
        token = metaTag.getAttribute('content')
    }
    
    // 2. Desde props de Inertia (si está disponible)
    if (!token && window.Laravel?.csrfToken) {
        token = window.Laravel.csrfToken
    }
    
    // 3. Desde cookie XSRF-TOKEN
    if (!token) {
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
        if (match) {
            token = decodeURIComponent(match[1])
        }
    }
    
    return token
}

function showNotification(message, type = 'info') {
    // Crear notificación visual
    const notification = document.createElement('div')
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `
    
    // Agregar animación
    const style = document.createElement('style')
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `
    document.head.appendChild(style)
    
    notification.textContent = message
    document.body.appendChild(notification)

    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideIn 0.3s ease-out reverse'
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification)
                }
                if (style.parentNode) {
                    style.parentNode.removeChild(style)
                }
            }, 300)
        }
    }, 3000)
}

export default setupInertiaCSRF