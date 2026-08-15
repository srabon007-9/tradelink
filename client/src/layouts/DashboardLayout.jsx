/**
 * layouts/DashboardLayout.jsx — Authenticated member layout.
 */

import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';
import Avatar from '../components/ui/Avatar';
import { ROUTES } from '../constants';
import useAuth from '../hooks/useAuth';

const SIDEBAR_LINKS = [
  { label: 'Overview',       to: ROUTES.DASHBOARD,             icon: 'OV' },
  { label: 'Browse Skills',  to: ROUTES.BROWSE,                icon: 'SK' },
  { label: 'Market Prices',  to: `${ROUTES.DASHBOARD}/prices`, icon: 'MP' },
  { label: 'My Profile',     to: `${ROUTES.DASHBOARD}/profile`,  icon: 'PF' },
  { label: 'My Skills',      to: `${ROUTES.DASHBOARD}/skills`,   icon: 'MS' },
  { label: 'Requests',       to: `${ROUTES.DASHBOARD}/requests`, icon: 'RQ' },
  { label: 'Transactions',   to: `${ROUTES.DASHBOARD}/transactions`, icon: 'TX' },
  { label: 'Wallet',         to: `${ROUTES.DASHBOARD}/wallet`,  icon: 'CR' },
  { label: 'Messages',       to: `${ROUTES.DASHBOARD}/messages`, icon: 'MG' },
  { label: 'Reviews',        to: `${ROUTES.DASHBOARD}/reviews`,  icon: 'RV' },
  { label: 'Settings',       to: `${ROUTES.DASHBOARD}/settings`, icon: 'ST' },
];

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')[0] || 'Member Workspace';

  const handleExit = async () => {
    await logout();
    navigate(ROUTES.HOME);
  };

  return (
  <div className="min-h-screen bg-page lg:flex">
    <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col border-r border-concrete-200 bg-white">
      <div className="border-b border-concrete-200 p-5">
        <Logo />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Dashboard navigation">
        {SIDEBAR_LINKS.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === ROUTES.DASHBOARD}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors duration-150 ${
                isActive
                  ? 'bg-navy-50 text-navy-900'
                  : 'text-steel-700 hover:bg-concrete-50 hover:text-navy-900'
              }`
            }
          >
            <span className="flex h-7 w-7 items-center justify-center rounded border border-concrete-200 bg-white text-[10px] font-bold text-steel-600">
              {link.icon}
            </span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-concrete-200 p-4">
        <div className="flex items-center gap-3 rounded-md bg-concrete-50 p-3">
          <Avatar initials="OP" size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-950">{firstName}</p>
            <p className="truncate text-xs text-steel-600">Demo Account</p>
          </div>
          <button
            type="button"
            onClick={handleExit}
            className="text-xs font-semibold text-steel-600 hover:text-navy-900"
          >
            Exit
          </button>
        </div>
      </div>
    </aside>

    <div className="min-h-screen flex-1 lg:ml-64">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-concrete-200 bg-white px-4 py-4 lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={handleExit}
          className="rounded-md border border-concrete-300 px-3 py-2 text-sm font-semibold text-steel-700"
        >
          Exit
        </button>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  </div>
  );
};

export default DashboardLayout;
