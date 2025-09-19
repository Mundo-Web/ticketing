// Ejemplo de cómo usar el nuevo sistema CSRF

import { useCSRF } from '@/hooks/use-csrf';

function ExampleComponent() {
    const csrf = useCSRF();

    // ANTES (código actual en las páginas):
    const oldWayDelete = () => {
        router.delete(`/tickets/${ticket.id}`, {
            preserveScroll: true,
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
            },
            onSuccess: () => {
                // success handler
            },
            onError: () => {
                // error handler
            }
        });
    };

    // NUEVO (forma simplificada):
    const newWayDelete = () => {
        csrf.delete(`/tickets/${ticket.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                // success handler
            },
            onError: () => {
                // error handler
            }
        });
    };

    // ANTES (fetch manual con CSRF):
    const oldWayFetch = async () => {
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        const response = await fetch('/api/endpoint', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrfToken || '',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    };

    // NUEVO (fetch simplificado):
    const newWayFetch = async () => {
        const response = await csrf.fetch('/api/endpoint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    };

    return (
        <div>
            {/* El componente funciona igual, pero con menos código repetitivo */}
        </div>
    );
}

/*
BENEFICIOS:

1. **Menos código repetitivo**: No más copy/paste de CSRF token
2. **Manejo automático de errores 419**: Se recarga automáticamente
3. **Compatibilidad total**: Funciona con el código existente
4. **Interceptores globales**: Funciona incluso sin modificar páginas existentes
5. **Mejor debugging**: Logs automáticos de problemas CSRF
6. **Notificaciones automáticas**: Usuario informado de problemas de sesión

MIGRACIÓN GRADUAL:

1. Las páginas existentes seguirán funcionando (interceptores globales)
2. Nuevas páginas pueden usar useCSRF() hook
3. Páginas existentes se pueden migrar gradualmente
4. Compatibilidad 100% con el patrón actual
*/