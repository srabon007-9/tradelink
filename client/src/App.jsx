/**
 * App.jsx — Root Application Component
 *
 * Wraps the app in context providers and renders the router.
 */

import { AuthProvider } from './context/AuthContext';
import AppRouter from './routes/AppRouter';

const App = () => (
  <AuthProvider>
    <AppRouter />
  </AuthProvider>
);

export default App;
