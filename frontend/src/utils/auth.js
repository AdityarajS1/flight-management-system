const TOKEN_KEY = 'token';
const USER_KEY = 'user';
export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const getStoredUser = () => {
    const userData = localStorage.getItem(USER_KEY);
    if (!userData) {
        return null;
    }
    try {
        return JSON.parse(userData);
    }
    catch (error) {
        clearStoredAuth();
        return null;
    }
};
export const storeAuth = (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
};
export const clearStoredAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authRole');
    localStorage.removeItem('authEmail');
};
export const isAdminUser = (user) => (user === null || user === void 0 ? void 0 : user.role) === 'ADMIN';
