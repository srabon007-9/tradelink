/**
 * layouts/MainLayout.jsx — Public Page Layout
 *
 * Renders: Navbar → Page Content (Outlet) → Footer
 * Used for all public-facing pages.
 */

import { Outlet, ScrollRestoration } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';

const MainLayout = () => (
  <div className="flex flex-col min-h-screen app-shell">
    <Navbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
    <ScrollRestoration />
  </div>
);

export default MainLayout;
