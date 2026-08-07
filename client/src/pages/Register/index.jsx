/**
 * pages/Register/index.jsx — Member registration page.
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import Logo from '../../components/common/Logo';
import Button from '../../components/ui/Button';

const Register = () => (
  <div className="flex min-h-screen items-center justify-center bg-page px-4 py-20">
    <div className="w-full max-w-lg">
      <div className="surface-card p-8 sm:p-10">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-950">Create member account</h1>
          <p className="mt-2 text-sm text-steel-600">
            Capture the minimum profile information future auth and onboarding features can use.
          </p>
        </div>

        <form className="space-y-4" aria-label="Member registration form">
          <div>
            <label htmlFor="register-name" className="mb-1.5 block text-sm font-medium text-steel-700">
              Full Name
            </label>
            <input id="register-name" type="text" autoComplete="name" placeholder="Your name" className="input-base" />
          </div>

          <div>
            <label htmlFor="register-email" className="mb-1.5 block text-sm font-medium text-steel-700">
              Email Address
            </label>
            <input id="register-email" type="email" autoComplete="email" placeholder="name@company.com" className="input-base" />
          </div>

          <div>
            <label htmlFor="register-primary-skill" className="mb-1.5 block text-sm font-medium text-steel-700">
              Primary Skill
            </label>
            <input id="register-primary-skill" type="text" placeholder="Frontend development, design, writing..." className="input-base" />
          </div>

          <div>
            <label htmlFor="register-location" className="mb-1.5 block text-sm font-medium text-steel-700">
              Location
            </label>
            <input id="register-location" type="text" placeholder="Dhaka, Chattogram, Remote..." className="input-base" />
          </div>

          <div className="flex items-start gap-3 pt-1">
            <input id="register-terms" type="checkbox" className="mt-1 h-4 w-4 rounded border-concrete-300 text-navy-800 focus:ring-navy-700" />
            <label htmlFor="register-terms" className="text-sm leading-6 text-steel-600">
              I agree that TradeLink may contact me about account setup and collaboration requests.
            </label>
          </div>

          <Button id="register-submit-btn" type="submit" fullWidth>
            Create Account
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

export default Register;
