// Lightweight auth helpers: persist token and provide auth-aware fetch
export function saveToken(token, tokenType = 'bearer') {
    try {
        localStorage.setItem('access_token', token);
        localStorage.setItem('token_type', tokenType || 'bearer');
    } catch (err) {
        console.warn('Could not persist token to localStorage', err);
    }
}

export function getToken() {
    try {
        const token = localStorage.getItem('access_token');
        const tokenType = localStorage.getItem('token_type') || 'bearer';
        return { token, tokenType };
    } catch (err) {
        console.warn('Could not read token from localStorage', err);
        return { token: null, tokenType: 'bearer' };
    }
}

export function getAuthHeader() {
    const { token, tokenType } = getToken();
    if (!token) return {};
    const capType = tokenType ? tokenType.charAt(0).toUpperCase() + tokenType.slice(1) : 'Bearer';
    return { Authorization: `${capType} ${token}` };
}

// Convenience wrapper that attaches Authorization header when a token exists
export async function authFetch(url, options = {}) {
    const headers = options.headers ? { ...options.headers } : {};
    Object.assign(headers, getAuthHeader());
    const opts = { ...options, headers };
    return fetch(url, opts);
}

export function clearAuth() {
    try {
        localStorage.removeItem('access_token');
        localStorage.removeItem('token_type');
        localStorage.removeItem('user');
    } catch (err) {
        console.warn('Could not clear auth from localStorage', err);
    }
}
