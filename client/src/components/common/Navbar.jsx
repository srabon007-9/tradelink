/**
 * components/common/Navbar.jsx — Responsive Navigation Bar
 */

import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Logo from './Logo';
import { NAV_LINKS, ROUTES } from '../../constants';
import useAuth from '../../hooks/useAuth';

const Navbar = () => {
  const { isLoggedIn, logout, walletBalance } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen]   = useState(false);
  const [isScrolled, setIsScrolled]   = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  const handleLogout = async () => {
    closeMenu();
    await logout();
    navigate('/');
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b border-concrete-200 transition-all duration-150 ${
        isScrolled
          ? 'bg-white/95 shadow-nav backdrop-blur py-3'
          : 'bg-white/90 backdrop-blur py-4'
      }`}
    >
      <div className="container-xl">
        <nav className="flex items-center justify-between" role="navigation" aria-label="Main navigation">

          {/* Logo */}
          <Logo />

          {/* Desktop Nav Links */}
          <ul className="hidden md:flex items-center gap-1" role="list">
            {NAV_LINKS.map(link => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-navy-900 bg-concrete-100'
                        : 'text-steel-700 hover:text-navy-900 hover:bg-concrete-50'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <Link
                  to={ROUTES.WALLET}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-navy-800 bg-navy-50 text-xs font-bold text-navy-900 hover:bg-navy-100 transition-colors"
                >
                  <span>💳</span>
                  <span>{walletBalance !== null ? `${walletBalance} Credits` : '…'}</span>
                </Link>
                <button
                  id="navbar-logout-btn"
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-md border border-concrete-300 text-sm font-semibold text-steel-700 hover:border-red-300 hover:text-red-600 hover:bg-red-50 transition-colors duration-150"
                >
                  Log Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to={ROUTES.LOGIN}
                  className="px-4 py-2 rounded-md text-sm font-semibold text-steel-700 hover:text-navy-900 transition-colors duration-150"
                >
                  Member Login
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="btn-primary"
                >
                  Join TradeLink
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            id="navbar-mobile-toggle"
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            onClick={() => setIsMenuOpen(prev => !prev)}
            className="md:hidden flex flex-col gap-1.5 p-2 rounded-md hover:bg-concrete-50 transition-colors"
          >
            <span className={`block h-0.5 w-6 bg-navy-900 transition-all duration-150 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`block h-0.5 bg-navy-900 transition-all duration-150 ${isMenuOpen ? 'opacity-0 w-0' : 'w-6'}`} />
            <span className={`block h-0.5 w-6 bg-navy-900 transition-all duration-150 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </nav>

        {/* Mobile Dropdown Menu */}
        <div
          id="mobile-menu"
          className={`md:hidden transition-all duration-150 overflow-hidden ${
            isMenuOpen ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="surface-card p-3 flex flex-col gap-1">
            {NAV_LINKS.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-navy-900 bg-concrete-100'
                      : 'text-steel-700 hover:text-navy-900 hover:bg-concrete-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <div className="border-t border-concrete-200 pt-3 mt-1 flex flex-col gap-2">
              {isLoggedIn ? (
                <button
                  id="navbar-mobile-logout-btn"
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-3 rounded-md border border-concrete-300 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors text-center"
                >
                  Log Out
                </button>
              ) : (
                <>
                  <Link
                    to={ROUTES.LOGIN}
                    onClick={closeMenu}
                    className="px-4 py-3 rounded-md text-sm font-semibold text-steel-700 hover:text-navy-900 hover:bg-concrete-50 transition-colors text-center"
                  >
                    Member Login
                  </Link>
                  <Link
                    to={ROUTES.REGISTER}
                    onClick={closeMenu}
                    className="btn-primary text-center"
                  >
                    Join TradeLink
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
