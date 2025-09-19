// hooks/use-csrf.js
import { useCallback } from 'react';
import { router } from '@inertiajs/react';
import { getCSRFToken, createCSRFHeaders, createInertiaConfig, csrfFetch } from '@/utils/csrf-helper';

/**
 * Hook personalizado para manejo de CSRF en componentes React
 */
export function useCSRF() {
    // Wrapper para router.post con CSRF automático
    const post = useCallback((url, data = {}, config = {}) => {
        return router.post(url, data, createInertiaConfig(config));
    }, []);

    // Wrapper para router.put con CSRF automático
    const put = useCallback((url, data = {}, config = {}) => {
        return router.put(url, data, createInertiaConfig(config));
    }, []);

    // Wrapper para router.delete con CSRF automático
    const del = useCallback((url, config = {}) => {
        return router.delete(url, createInertiaConfig(config));
    }, []);

    // Wrapper para router.patch con CSRF automático
    const patch = useCallback((url, data = {}, config = {}) => {
        return router.patch(url, data, createInertiaConfig(config));
    }, []);

    // Fetch con CSRF automático
    const fetch = useCallback((url, options = {}) => {
        return csrfFetch(url, options);
    }, []);

    // Obtener token CSRF actual
    const token = useCallback(() => {
        return getCSRFToken();
    }, []);

    // Crear headers con CSRF
    const headers = useCallback((additionalHeaders = {}) => {
        return createCSRFHeaders(additionalHeaders);
    }, []);

    return {
        post,
        put,
        delete: del,
        patch,
        fetch,
        token,
        headers,
        // Métodos originales por si se necesitan
        router: {
            post: router.post,
            put: router.put,
            delete: router.delete,
            patch: router.patch
        }
    };
}

export default useCSRF;