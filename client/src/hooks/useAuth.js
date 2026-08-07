/**
 * hooks/useAuth.js — Authentication Hook
 *
 * Convenience hook that reads from AuthContext.
 * Must be used inside <AuthProvider>.
 *
 * Usage:
 *   const { user, isLoggedIn, login, logout } = useAuth();
 */

import { useContext } from 'react';
import AuthContext from '../context/AuthContext';

/**
 * @returns {import('../context/AuthContext').AuthContextValue}
 */
const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }

  return context;
};

export default useAuth;
