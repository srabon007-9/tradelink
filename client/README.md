# TradeLink Client

React/Vite frontend for the TradeLink member skill exchange scaffold.

## Purpose

The client provides boilerplate screens for a skill marketplace: public marketing pages, a browseable skill directory, member login/registration, contact, and a dashboard shell. Data is currently static and centralized in `src/constants/index.js` so teammates can replace it module by module.

## Important Files

- `src/main.jsx`: mounts the React app.
- `src/App.jsx`: wraps the application in `AuthProvider` and renders the router.
- `src/routes/AppRouter.jsx`: defines public routes and dashboard route.
- `src/layouts/MainLayout.jsx`: public navbar, outlet, footer, and scroll restoration.
- `src/layouts/DashboardLayout.jsx`: member sidebar and dashboard content shell.
- `src/index.css`: global Tailwind layers and design-system component classes.
- `src/constants/index.js`: brand, route, skill, workflow, feature, and team-note data.
- `src/services/api.js`: Axios client configured for the backend API base URL.
- `src/context/AuthContext.jsx`: authentication state scaffold.

## Design System

The UI uses a restrained product palette:

- White and off-white surfaces
- Dark navy for primary actions and structure
- Steel and concrete grays for text, borders, and panels
- Subtle amber accent for status and emphasis
- 4px to 8px radius for controls and cards
- Minimal shadows and no decorative gradients or animated background effects

Reusable components live under `src/components/`:

- `common/Logo.jsx`
- `common/Navbar.jsx`
- `common/Footer.jsx`
- `layout/Container.jsx`
- `layout/PageHeader.jsx`
- `layout/Section.jsx`
- `ui/Avatar.jsx`
- `ui/Badge.jsx`
- `ui/Button.jsx`
- `ui/Card.jsx`
- `ui/SectionHeading.jsx`

## Routes

| Path | Page |
|---|---|
| `/` | Home |
| `/browse` | Skill directory |
| `/about` | Platform overview |
| `/contact` | General contact |
| `/login` | Member login scaffold |
| `/register` | Member registration scaffold |
| `/dashboard` | Member dashboard shell |

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Known TODOs

- Connect forms to backend endpoints.
- Replace static skill/member constants with API data.
- Add protected route handling once auth is implemented.
- Add profile, skill management, requests, messages, reviews, and settings routes.
- Add responsive/browser regression tests for key pages.
