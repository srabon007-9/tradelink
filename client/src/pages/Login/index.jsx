/**
 * pages/Login/index.jsx — Member login page.
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import Logo from '../../components/common/Logo';
import Button from '../../components/ui/Button';

const Login = () => (
  <div className="flex min-h-screen items-center justify-center bg-page px-4 py-20">
    <div className="w-full max-w-md">
      <div className="surface-card p-8 sm:p-10">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-950">Member login</h1>
          <p className="mt-2 text-sm text-steel-600">Access your profile, listed skills, requests, messages, and reviews.</p>
        </div>

        <form className="space-y-5" aria-label="Login form">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-steel-700">
              Email address
            </label>
            <input id="login-email" type="email" autoComplete="email" placeholder="name@company.com" className="input-base" />
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
            <input id="login-password" type="password" autoComplete="current-password" placeholder="Enter password" className="input-base" />
          </div>

          <Button id="login-submit-btn" type="submit" fullWidth>
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-steel-600">
          New to TradeLink?{' '}
          <Link to={ROUTES.CONTACT} className="font-semibold text-navy-800 hover:text-navy-900">
            Contact the team
          </Link>
        </p>
      </div>
    </div>
  </div>
);

export default Login;
