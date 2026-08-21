/**
 * components/common/ProtectedRoute.jsx — Protects authenticated dashboard routes.
 */

import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../constants';
import AuthContext from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn } = useContext(AuthContext);
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  return children;
};

export default ProtectedRoute;
