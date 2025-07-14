/**
 * Utility function to get CSRF token from meta tag
 */
export const getCsrfToken = (): string | null => {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || null;
};

/**
 * Utility function to create FormData with CSRF token
 */
export const createFormDataWithCsrf = (): FormData => {
    const formData = new FormData();
    const csrfToken = getCsrfToken();
    
    if (csrfToken) {
        formData.append('_token', csrfToken);
    }
    
    return formData;
};

/**
 * Add CSRF token to existing FormData
 */
export const addCsrfToFormData = (formData: FormData): FormData => {
    const csrfToken = getCsrfToken();
    
    if (csrfToken) {
        formData.append('_token', csrfToken);
    }
    
    return formData;
};
