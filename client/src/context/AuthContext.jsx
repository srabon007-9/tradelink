/**
 * context/AuthContext.jsx — Authentication Context
 *
 * Provides auth state and actions to the entire app.
 *
 * TODO (Member 2/3 — Frontend):
 *  - Implement login(email, password)
 *  - Implement register(name, email, password)
 *  - Implement logout()
 *  - Implement token refresh logic
 *  - Persist auth state to localStorage / httpOnly cookie
 */

import { createContext, useState } from 'react';

/** @type {React.Context<AuthContextValue>} */
const AuthContext = createContext(null);

/**
 * @typedef {object} AuthContextValue
 * @property {object|null} user        - Current authenticated user or null
 * @property {boolean}     isLoading   - Auth state is being determined
 * @property {boolean}     isLoggedIn  - Whether user is authenticated
 * @property {Function}    login       - login(email, password) → Promise
 * @property {Function}    register    - register(data) → Promise
 * @property {Function}    logout      - logout() → void
 */

/**
 * Wraps the app to provide authentication context.
 * @param {{ children: React.ReactNode }} props
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Stubs — implement when auth feature is developed
  const login = async (_email, _password) => {
    setIsLoading(true);
    // TODO: call authService.login, set user + token
    setIsLoading(false);
  };

  const register = async _data => {
    setIsLoading(true);
    // TODO: call authService.register
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    // TODO: clear tokens, redirect
  };

  const value = {
    user,
    isLoading,
    isLoggedIn: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
