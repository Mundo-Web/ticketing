// utils/csrf-interceptor.js
import { router } from '@inertiajs/react'

class CSRFManager {
    constructor() {
        this.isRefreshing = false
        this.refreshPromise = null
        this.setupInterceptors()
    }

    setupInterceptors() {
        // Interceptar errores de Inertia
        router.on('error', (event) => {
            const { errors } = event.detail
            
            // Si es error 419 (CSRF Token Mismatch)
            if (errors && (errors.status === 419 || errors.message?.includes('419'))) {
                console.log('🔄 CSRF Token expired, refreshing automatically...')
                this.handleCSRFError(event)
            }
        })

        // Interceptar requests de Inertia para agregar token fresco
        router.on('before', (event) => {
            const token = this.getCurrentCSRFToken()
            if (token && event.detail.visit) {
                // Agregar token CSRF a headers
                event.detail.visit.headers = {
                    ...event.detail.visit.headers,
                    'X-CSRF-TOKEN': token
                }
            }
        })
    }

    async handleCSRFError(event) {
        // Prevenir múltiples refreshes simultáneos
        if (this.isRefreshing) {
            await this.refreshPromise
            return
        }

        this.isRefreshing = true
        this.refreshPromise = this.refreshCSRFToken()

        try {
            const newToken = await this.refreshPromise
            if (newToken) {
                console.log('✅ CSRF Token refreshed successfully')
                
                // Mostrar notificación al usuario
                this.showNotification('Session refreshed automatically', 'success')
                
                // Re-intentar la acción original después de un pequeño delay
                setTimeout(() => {
                    this.retryLastAction(event)
                }, 500)
            } else {
                this.showNotification('Session expired. Please reload the page.', 'error')
            }
        } catch (error) {
            console.error('❌ Failed to refresh CSRF token:', error)
            this.showNotification('Session error. Please reload the page.', 'error')
        } finally {
            this.isRefreshing = false
            this.refreshPromise = null
        }
    }

    async refreshCSRFToken() {
        try {
            const response = await fetch('/csrf-token', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                if (data.csrf_token) {
                    this.updateCSRFToken(data.csrf_token)
                    return data.csrf_token
                }
            }
        } catch (error) {
            console.error('Error refreshing CSRF token:', error)
        }
        return null
    }

    updateCSRFToken(token) {
        // Actualizar meta tag
        const metaTag = document.querySelector('meta[name="csrf-token"]')
        if (metaTag) {
            metaTag.setAttribute('content', token)
        }

        // Actualizar token global de Inertia
        if (window.Laravel && window.Laravel.csrfToken) {
            window.Laravel.csrfToken = token
        }

        // Actualizar axios si está disponible
        if (window.axios) {
            window.axios.defaults.headers.common['X-CSRF-TOKEN'] = token
        }
    }

    getCurrentCSRFToken() {
        const metaTag = document.querySelector('meta[name="csrf-token"]')
        return metaTag ? metaTag.getAttribute('content') : null
    }

    retryLastAction(event) {
        // Intentar recargar la página actual para aplicar la acción
        if (window.location.href) {
            window.location.reload()
        }
    }

    showNotification(message, type = 'info') {
        // Usar toast si está disponible
        if (window.toast) {
            if (type === 'error') {
                window.toast.error(message)
            } else if (type === 'success') {
                window.toast.success(message)
            } else {
                window.toast.info(message)
            }
            return
        }

        // Fallback: crear notificación visual simple
        const notification = document.createElement('div')
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: system-ui, -apple-system, sans-serif;
            font-size: 14px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        `
        notification.textContent = message
        document.body.appendChild(notification)

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification)
            }
        }, 4000)
    }

    // Auto-refresh token cada 30 minutos para prevenir expiración
    startAutoRefresh() {
        setInterval(async () => {
            if (!this.isRefreshing) {
                await this.refreshCSRFToken()
                console.log('🔄 CSRF Token auto-refreshed')
            }
        }, 30 * 60 * 1000) // 30 minutos
    }
}

// Inicializar el manager globalmente
const csrfManager = new CSRFManager()

// Exportar para uso manual si es necesario
export { csrfManager }

// Auto-iniciar el refresh automático
document.addEventListener('DOMContentLoaded', () => {
    csrfManager.startAutoRefresh()
})

export default csrfManager