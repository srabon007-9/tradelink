/**
 * pages/Register/index.jsx — Member registration page.
 */

import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants';
import Logo from '../../components/common/Logo';
import Button from '../../components/ui/Button';
import AuthContext from '../../context/AuthContext';

const Register = () => {
  const { register, isLoading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'client',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name || !form.email || !form.password) {
      setError('Name, email and password are required.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    const result = await register(form);

    if (result.success) {
      setSuccess('Account created! Redirecting to dashboard…');
      setTimeout(() => navigate(ROUTES.DASHBOARD), 1500);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4 py-20">
      <div className="w-full max-w-lg">
        <div className="surface-card p-8 sm:p-10">
          <div className="mb-8 flex justify-center">
            <Logo />
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-slate-950">Create member account</h1>
            <p className="mt-2 text-sm text-steel-600">
              Fill in your details below to join TradeLink.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} aria-label="Member registration form">
            <div>
              <label htmlFor="register-name" className="mb-1.5 block text-sm font-medium text-steel-700">
                Full Name
              </label>
              <input
                id="register-name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                className="input-base"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="register-email" className="mb-1.5 block text-sm font-medium text-steel-700">
                Email Address
              </label>
              <input
                id="register-email"
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
              <label htmlFor="register-password" className="mb-1.5 block text-sm font-medium text-steel-700">
                Password
              </label>
              <input
                id="register-password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="input-base"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="register-role" className="mb-1.5 block text-sm font-medium text-steel-700">
                Role
              </label>
              <select
                id="register-role"
                name="role"
                className="input-base"
                value={form.role}
                onChange={handleChange}
              >
                <option value="client">Client</option>
                <option value="operations">Operations</option>
              </select>
            </div>

            <Button id="register-submit-btn" type="submit" fullWidth disabled={isLoading}>
              {isLoading ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-steel-600">
            Already have member access?{' '}
            <Link to={ROUTES.LOGIN} className="font-semibold text-navy-800 hover:text-navy-900">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
