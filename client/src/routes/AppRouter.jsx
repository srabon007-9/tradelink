/**
 * routes/AppRouter.jsx — Application Router
 *
 * Central routing configuration using React Router v6.
 * Add new routes here when implementing new pages/features.
 *
 * Team note: coordinate with team members before adding new routes.
 */

import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';

import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import BrowseSkills from '../pages/BrowseSkills';
import Dashboard from '../pages/Dashboard';
import MySkills from '../pages/MySkills';
import CreateSkill from '../pages/CreateSkill';
import EditSkill from '../pages/EditSkill';
import SkillDetails from '../pages/SkillDetails';
import SkillPrices from '../pages/SkillPrices';
import About from '../pages/About';
import Contact from '../pages/Contact';
import NotFound from '../pages/NotFound';

const router = createBrowserRouter([
  // ─── Public Routes (MainLayout: Navbar + Footer) ─────────────────────────
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true,        element: <Home /> },
      { path: 'login',      element: <Login /> },
      { path: 'register',   element: <Register /> },
      { path: 'browse',     element: <BrowseSkills /> },
      { path: 'about',      element: <About /> },
      { path: 'contact',    element: <Contact /> },
    ],
  },

  // ─── Protected Routes (DashboardLayout) ──────────────────────────────────
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'skills', element: <MySkills /> },
      { path: 'skills/new', element: <CreateSkill /> },
      { path: 'skills/:id', element: <SkillDetails /> },
      { path: 'skills/:id/edit', element: <EditSkill /> },
      { path: 'prices', element: <SkillPrices /> },
      // Future: profile, requests, messages, reviews...
    ],
  },

  // ─── 404 ─────────────────────────────────────────────────────────────────
  { path: '*', element: <NotFound /> },
]);

const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;
