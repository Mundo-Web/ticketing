import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { Toaster } from "@/components/ui/sonner"
import { setupGlobalCSRFHandling } from './utils/csrf-helper';
const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Configurar token CSRF global
const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
if (token) {
    // Para Axios si está disponible
    if ((window as any).axios) {
        (window as any).axios.defaults.headers.common['X-CSRF-TOKEN'] = token;
    }
    
    // Para fetch requests
    (window as any).csrfToken = token;
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<><App {...props} /><Toaster /></>);
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();

// Configurar manejo automático de CSRF tokens
setupGlobalCSRFHandling();
