/**
 * pages/NotFound/index.jsx — 404 page.
 */

import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';

const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-page px-4">
    <div className="mx-auto max-w-lg text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent-700">404 Not Found</p>
      <h1 className="mt-4 text-4xl font-semibold text-slate-950">This page is not available</h1>
      <p className="mt-4 text-base leading-7 text-steel-600">
        The route may be incomplete, renamed, or outside the current application scope.
      </p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link id="notfound-home-btn" to={ROUTES.HOME} className="btn-primary">
          Back to Home
        </Link>
        <Link id="notfound-browse-btn" to={ROUTES.BROWSE} className="btn-ghost">
          Browse Skills
        </Link>
      </div>

      <p className="mt-8 text-sm text-steel-500">
        Error code: <span className="font-mono text-steel-700">404_NOT_FOUND</span>
      </p>
    </div>
  </div>
);

export default NotFound;
