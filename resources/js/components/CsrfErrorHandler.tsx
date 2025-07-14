import { useEffect } from 'react';
import { toast } from 'sonner';

interface CsrfErrorHandlerProps {
    onCsrfError?: () => void;
}

/**
 * Hook to handle CSRF errors globally
 */
export const useCsrfErrorHandler = (onCsrfError?: () => void) => {
    useEffect(() => {
        const handleCsrfError = (event: CustomEvent) => {
            const detail = event.detail as { status?: number };
            if (detail?.status === 419) {
                toast.error('Your session has expired. Please refresh the page and try again.', {
                    duration: 5000,
                    action: {
                        label: 'Refresh',
                        onClick: () => window.location.reload()
                    }
                });
                
                if (onCsrfError) {
                    onCsrfError();
                }
            }
        };

        // Listen for Inertia error events
        document.addEventListener('inertia:error', handleCsrfError);
        
        return () => {
            document.removeEventListener('inertia:error', handleCsrfError);
        };
    }, [onCsrfError]);
};

/**
 * Component to handle CSRF errors globally
 */
export const CsrfErrorHandler: React.FC<CsrfErrorHandlerProps> = ({ onCsrfError }) => {
    useCsrfErrorHandler(onCsrfError);
    return null;
};
