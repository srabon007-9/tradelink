/**
 * App.jsx — Root Application Component
 *
 * Wraps the app in AuthProvider & ToastProvider context providers.
 */

import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import AppRouter from './routes/AppRouter';

const App = () => (
  <AuthProvider>
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  </AuthProvider>
);

export default App;
