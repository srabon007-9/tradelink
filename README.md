# TradeLink

TradeLink is a MERN-style project scaffold for a member skill exchange. The current implementation focuses on a React frontend boilerplate and an organized Express MVC backend scaffold that teammates can extend with their assigned features.

This line is created by tasin
My second push (Srabon Ahmed changed this bracket line)
whats the issue??

No issues now
## Current Implementation

- Public React pages for home, skill browsing, platform overview, contact, member login, member registration, and 404.
- Dashboard shell for member profile, skills, requests, messages, reviews, and settings modules.
- Centralized frontend design system using Tailwind tokens for navy, steel gray, concrete gray, white/off-white surfaces, and subtle amber accents.
- Express API application with health check, error handling, route mounting, and placeholders for auth, users, listings, requests, messages, and reviews.
- Mongoose model placeholders are still scaffold-level and should be renamed or replaced as backend feature ownership becomes clear.

## Tech Stack

| Layer | Technology |
|---|---|
| Client | React 19, Vite, React Router, Tailwind CSS |
| Server | Node.js, Express, Mongoose |
| Validation | express-validator scaffold |
| Security/Middleware | helmet, cors, morgan |
| Database | MongoDB connection via Mongoose |

## Repository Structure

```text
tradelink/
├── client/
│   ├── public/                 # favicon and static assets
│   └── src/
│       ├── components/          # reusable UI, layout, and common components
│       ├── constants/           # routes, brand data, skill/member data, page content
│       ├── context/             # auth context scaffold
│       ├── layouts/             # public and dashboard shells
│       ├── pages/               # route-level React pages
│       ├── routes/              # React Router configuration
│       ├── services/            # Axios API client
│       └── utils/               # formatting and class-name helpers
├── server/
│   ├── config/                  # environment validation and MongoDB connection
│   ├── controllers/             # HTTP controller placeholders
│   ├── middleware/              # 404 and global error handling
│   ├── models/                  # Mongoose schema placeholders
│   ├── routes/                  # API route modules
│   ├── services/                # business logic placeholders
│   ├── utils/                   # response, error, and logger helpers
│   ├── app.js                   # Express app factory
│   └── server.js                # startup and graceful shutdown
├── .env.example
└── README.md
```

## Local Setup

Prerequisites:

- Node.js 18 or newer
- npm
- MongoDB running locally or a MongoDB Atlas URI

Install and run the server:

```bash
cd server
npm install
cp ../.env.example .env
npm run dev
```

Install and run the client:

```bash
cd client
npm install
npm run dev
```

Default URLs:

- Client: `http://localhost:5173` or the next available Vite port
- API health check: `http://localhost:5000/api/health`

## Available Scripts

Client:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

Server:

```bash
npm run dev
npm start
npm run lint
npm run lint:fix
npm run format
```

## Known TODOs

- Implement real authentication and protected dashboard routing.
- Replace static skill/member data with API-backed records.
- Add Mongoose schemas and persistence for members, skills, requests, messages, reviews, and users.
- Wire registration/contact forms to backend endpoints.
- Add tests for frontend rendering and backend API behavior.
- Add deployment configuration once hosting target is selected.
=======
This line is created by tasin
My second push (Srabon Ahmed changed this bracket line)
whats the issue??

No issues now
>>>>> shupty
