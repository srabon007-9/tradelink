/**
 * pages/Login/index.jsx — Member login page.
 */

import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants';
import Logo from '../../components/common/Logo';
import Button from '../../components/ui/Button';
import AuthContext from '../../context/AuthContext';

const Login = () => {
  const { login, isLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }

    const result = await login(form.email, form.password);

    if (result.success) {
      navigate(ROUTES.DASHBOARD);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4 py-20">
      <div className="w-full max-w-md">
        <div className="surface-card p-8 sm:p-10">
          <div className="mb-8 flex justify-center">
            <Logo />
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-slate-950">Member login</h1>
            <p className="mt-2 text-sm text-steel-600">
              Access your profile, listed skills, requests, messages, and reviews.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} aria-label="Login form">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-steel-700">
                Email address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                className="input-base"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="login-password" className="block text-sm font-medium text-steel-700">
                  Password
                </label>
                <Link to="#" className="text-xs font-semibold text-navy-800 hover:text-navy-900">
                  Reset password
                </Link>
              </div>
              <input
                id="login-password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter password"
                className="input-base"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <Button id="login-submit-btn" type="submit" fullWidth disabled={isLoading}>
              {isLoading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-steel-600">
            New to TradeLink?{' '}
            <Link to={ROUTES.REGISTER} className="font-semibold text-navy-800 hover:text-navy-900">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
