# Event Management System

> **How to use this document with an AI**cd
> 1. Paste **Section 0 (Global Context)** at the start of the conversation. Keep it in context for every phase.
> 2. Then give the AI **one phase at a time**. Do not move on until that phase's *Acceptance Criteria* pass.
> 3. After each phase, run the code and test it. Paste any errors back to the AI before continuing.
> 4. Every phase says "Output" so the AI knows exactly which files to produce.

---

# 0. Global Context (paste this first, always)

## 0.1 Project summary
Build a full-stack **Event Management application**. A logged-in user (organizer) can create and manage their own events, manage the attendee list for each event, update event status, search and filter events, and see dashboard statistics. Each user can only ever see and modify **their own data**.

## 0.2 Tech stack

**Backend**
- Node.js + Express
- MongoDB with Mongoose models
- `bcryptjs` (or `bcrypt`) for password hashing
- `jsonwebtoken` for login tokens
- `dotenv` for secrets, `cors` for cross-origin requests
- `express-validator` (or `zod`/`joi`) for input validation
- `morgan` for request logging, `nodemon` for development

**Frontend**
- React (Vite) + React Router
- Axios (with an interceptor that attaches the token)
- Context API for auth state (Redux Toolkit is acceptable if preferred)
- Tailwind CSS for styling

**Deployment (all free plans)**
- Database: MongoDB Atlas
- API: Render
- React app: Vercel or Netlify

## 0.3 Folder layout

```
event-management/
├── server/
│   ├── config/          # db.js
│   ├── models/          # User.js, Event.js, Attendee.js
│   ├── controllers/     # authController.js, eventController.js, attendeeController.js, statsController.js
│   ├── routes/          # authRoutes.js, eventRoutes.js, attendeeRoutes.js, statsRoutes.js
│   ├── middleware/      # auth.js, errorHandler.js, validate.js
│   ├── utils/           # pagination.js, asyncHandler.js
│   ├── .env             # never commit
│   ├── .env.example
│   ├── app.js
│   └── server.js
└── client/
    ├── src/
    │   ├── components/  # Navbar, ProtectedRoute, EventCard, EventForm, AttendeeTable, Pagination, StatusBadge, Loader, Toast
    │   ├── pages/       # Login, Register, Dashboard, Events, EventDetails, EventCreate/Edit, NotFound
    │   ├── services/    # api.js (axios instance), authService.js, eventService.js, attendeeService.js, statsService.js
    │   ├── context/     # AuthContext.jsx
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env             # VITE_API_URL
    └── index.html
```

## 0.4 Auth flow (applies to every phase)
1. **Register**: user sends name, email, password. Password is hashed with bcrypt. Return the user (no password) and a token.
2. **Login**: user sends email, password. Verify with bcrypt, sign a JWT (expires in 7 days), return it.
3. Client stores the token and sends `Authorization: Bearer <token>` on every request.
4. An **auth middleware** verifies the token, loads the user, and sets `req.user`.
5. All routes except `POST /api/auth/register` and `POST /api/auth/login` are **protected**.
6. Every query on Events and Attendees **must filter by `owner: req.user._id`**. A user requesting another user's record gets **404** (do not reveal that it exists).

## 0.5 Data models

**User**
| Field | Type | Rules |
|---|---|---|
| name | String | required, trim, 2-50 chars |
| email | String | required, unique, lowercase, valid email |
| password | String | required, min 6 chars, `select: false`, hashed in a pre-save hook |
| createdAt / updatedAt | Date | timestamps |

**Event** (Resource 1: main data)
| Field | Type | Rules |
|---|---|---|
| owner | ObjectId (ref User) | required, indexed |
| title | String | required, 3-100 chars |
| description | String | optional, max 1000 |
| category | String | enum: `conference`, `workshop`, `meetup`, `wedding`, `concert`, `party`, `other` |
| location | String | required |
| startDate | Date | required |
| endDate | Date | required, must be >= startDate |
| capacity | Number | required, min 1 |
| ticketPrice | Number | default 0, min 0 |
| status | String | enum: `draft`, `published`, `ongoing`, `completed`, `cancelled`; default `draft` |
| createdAt / updatedAt | Date | timestamps |

Add a text index on `title`, `description`, `location` for search.

**Attendee** (Resource 2: supporting data)
| Field | Type | Rules |
|---|---|---|
| owner | ObjectId (ref User) | required, indexed |
| event | ObjectId (ref Event) | required, indexed |
| name | String | required |
| email | String | required, valid email |
| phone | String | optional |
| rsvpStatus | String | enum: `invited`, `confirmed`, `declined`; default `invited` |
| checkedIn | Boolean | default false |
| checkedInAt | Date | set when checked in |
| createdAt / updatedAt | Date | timestamps |

Unique compound index on `(event, email)` so the same email cannot be added twice to one event.

## 0.6 API list (18 endpoints)

| Group | Method + Route | Purpose | Auth |
|---|---|---|---|
| **Auth (3)** | `POST /api/auth/register` | Create account, hash password, return token | Public |
| | `POST /api/auth/login` | Verify credentials, return token | Public |
| | `GET /api/auth/me` | Current user profile | Yes |
| **Events (5)** | `POST /api/events` | Create event | Yes |
| | `GET /api/events` | List own events (pagination + filters) | Yes |
| | `GET /api/events/:id` | Get one event | Yes |
| | `PUT /api/events/:id` | Update event | Yes |
| | `DELETE /api/events/:id` | Delete event and its attendees | Yes |
| **Attendees (5)** | `POST /api/events/:eventId/attendees` | Add attendee to event | Yes |
| | `GET /api/events/:eventId/attendees` | List attendees (pagination + filter by rsvp) | Yes |
| | `GET /api/attendees/:id` | Get one attendee | Yes |
| | `PUT /api/attendees/:id` | Update attendee | Yes |
| | `DELETE /api/attendees/:id` | Remove attendee | Yes |
| **Special (4)** | `GET /api/events/search?q=` | Text search on events | Yes |
| | `PATCH /api/events/:id/status` | Change event status (with allowed transitions) | Yes |
| | `GET /api/stats/dashboard` | Totals and breakdowns for the dashboard | Yes |
| | `PATCH /api/attendees/:id/checkin` | Toggle check-in for an attendee | Yes |

> Route order matters: declare `GET /api/events/search` **before** `GET /api/events/:id`.

## 0.7 Global rules for all code
- **Validation**: validate every request body, params, and query. Return `400` with `{ success:false, message, errors:[{field, message}] }`.
- **Status codes**: `200` OK, `201` created, `400` validation error / bad ObjectId, `401` missing or invalid token / wrong credentials, `404` not found (including "not yours"), `409` duplicate (email already registered), `500` server error.
- **Response shape**: `{ success: true, data: ..., message?: ... }`. For lists: `{ success: true, data: [...], pagination: { page, limit, total, totalPages } }`.
- **Pagination** on every list API: `?page=1&limit=10` (default 10, max 50), sorted by `createdAt` descending unless specified.
- **Security**: never return password fields, never log secrets, use environment variables, CORS restricted to the client URL from env.
- **Code style**: async/await with an `asyncHandler` wrapper, a central error handler, small controller functions, comments only where logic is non-obvious.
- **Ownership**: every Event/Attendee query includes `owner: req.user._id`.

---

# PHASE 1: Project setup and backend foundation

**Goal:** A running Express server connected to MongoDB with a clean structure.

**Tasks**
1. Create the folder layout in 0.3 (server only for now).
2. `npm init`, install: `express mongoose dotenv cors bcryptjs jsonwebtoken express-validator morgan` and dev: `nodemon`.
3. `config/db.js` connects to Mongo using `MONGO_URI`.
4. `app.js`: json parser, cors (origin from `CLIENT_URL`), morgan, a `GET /api/health` route, 404 handler for unknown routes, and the central error handler.
5. `server.js`: load env, connect DB, start listening on `PORT`.
6. Create `.env.example` with `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`.
7. Add scripts: `"dev": "nodemon server.js"`, `"start": "node server.js"`.
8. Create `middleware/errorHandler.js` that handles Mongoose `ValidationError`, `CastError` (invalid ObjectId → 400), duplicate key `11000` (→ 409), JWT errors (→ 401).

**Output:** all files above, plus `.gitignore` (node_modules, .env).

**Acceptance criteria**
- `npm run dev` starts and logs "MongoDB connected".
- `GET /api/health` returns `200 { success: true }`.
- Unknown route returns `404` JSON.

---

# PHASE 2: Authentication (3 APIs)

**Goal:** Register, login, and a protected profile route.

**Tasks**
1. `models/User.js` per 0.5 with a pre-save hook that hashes the password (salt rounds 10) and a `matchPassword` method.
2. `controllers/authController.js`: `register`, `login`, `getMe`.
   - Register: reject duplicate email with `409`. Return `201` with `{ user, token }`.
   - Login: same generic error `401 "Invalid email or password"` for wrong email **or** wrong password.
3. `middleware/auth.js` (`protect`): reads `Authorization: Bearer <token>`, verifies, loads the user, sets `req.user`. Missing/invalid/expired → `401`.
4. `middleware/validate.js`: reusable wrapper that runs express-validator rules and returns `400` on failure.
5. `routes/authRoutes.js` and mount at `/api/auth`.

**Acceptance criteria**
- Register with valid data → `201` and token; password never in response.
- Register same email again → `409`.
- Invalid email or short password → `400` with field errors.
- Login wrong password → `401`; correct → `200` with token.
- `GET /api/auth/me` without token → `401`; with token → `200` user.

**Postman checkpoint:** create a Postman collection "Event Management", a `{{baseUrl}}` and `{{token}}` variable, and a test script on Login that saves the token automatically.

---

# PHASE 3: Events resource (5 APIs)

**Goal:** Full CRUD for events, owned per user, with pagination and filters.

**Tasks**
1. `models/Event.js` per 0.5, with indexes (`owner`, text index, `owner + status`, `owner + startDate`).
2. `utils/pagination.js`: helper that parses `page`/`limit` safely and builds the pagination object.
3. `controllers/eventController.js`:
   - `createEvent`: set `owner` from `req.user`; validate `endDate >= startDate`. Return `201`.
   - `getEvents`: only own events; supports `page`, `limit`, `sort` (e.g. `startDate`, `-startDate`), and filters: `status`, `category`, `from` and `to` (date range on `startDate`), `minPrice`, `maxPrice`.
   - `getEventById`: `404` if not found or not owned.
   - `updateEvent`: only allowed fields; re-validate dates; `404` if not owned.
   - `deleteEvent`: delete the event **and all its attendees**. Return `200`.
4. `routes/eventRoutes.js` with `protect` applied to all routes; add validation rules; mount at `/api/events`.

**Acceptance criteria**
- Creating an event with `endDate` before `startDate` → `400`.
- Listing returns only the logged-in user's events with correct pagination numbers.
- `?status=published&category=meetup` filters properly.
- User B requesting user A's event id → `404`.
- Invalid ObjectId → `400`.
- Deleting an event removes its attendees.

---

# PHASE 4: Attendees resource (5 APIs)

**Goal:** Manage guest lists per event.

**Tasks**
1. `models/Attendee.js` per 0.5 with the unique compound index `(event, email)`.
2. `controllers/attendeeController.js`:
   - `addAttendee` (`POST /api/events/:eventId/attendees`): verify the event exists **and is owned by the user** (else `404`). Enforce **capacity**: if confirmed+invited attendees >= `event.capacity`, return `400 "Event is at full capacity"`. Duplicate email in the same event → `409`.
   - `getAttendees` (`GET /api/events/:eventId/attendees`): paginated; filters `rsvpStatus`, `checkedIn`, and `q` (search name/email).
   - `getAttendeeById`, `updateAttendee`, `deleteAttendee`: ownership enforced; `404` if not owned.
3. `routes/attendeeRoutes.js`. Nested routes are mounted in `eventRoutes` (or with `mergeParams`), and direct routes at `/api/attendees`.

**Acceptance criteria**
- Cannot add attendees to another user's event (`404`).
- Adding the same email twice to one event → `409`; same email on a different event is allowed.
- Adding beyond capacity → `400`.
- Filtering by `rsvpStatus=confirmed` works with pagination.

---

# PHASE 5: Special APIs (4 APIs)

**Goal:** Search, status change, stats, check-in.

**Tasks**
1. **Search**: `GET /api/events/search?q=term&page=&limit=`. Uses the text index or case-insensitive regex on title, description, location. Only own events. Empty `q` → `400`.
2. **Status change**: `PATCH /api/events/:id/status` with body `{ status }`. Enforce allowed transitions:
   - `draft` → `published`, `cancelled`
   - `published` → `ongoing`, `cancelled`
   - `ongoing` → `completed`, `cancelled`
   - `completed` and `cancelled` are final (no changes).
   Invalid transition → `400` with a clear message. Do not allow `published` if `startDate` is in the past.
3. **Dashboard stats**: `GET /api/stats/dashboard` returns for the logged-in user:
   - `totalEvents`, `upcomingEvents` (published, startDate >= now), `totalAttendees`
   - `eventsByStatus` (count per status)
   - `eventsByCategory`
   - `rsvpBreakdown` (invited/confirmed/declined counts)
   - `checkInRate` (checked-in / confirmed as a percentage)
   - `nextEvents` (next 5 upcoming events)
   Use MongoDB aggregation pipelines with `$match: { owner }`.
4. **Check-in**: `PATCH /api/attendees/:id/checkin` toggles `checkedIn`, sets or clears `checkedInAt`. Only allowed if the attendee's `rsvpStatus` is `confirmed` (else `400`) and the event status is `published` or `ongoing`.

**Acceptance criteria**
- `/search` route is not swallowed by `/:id`.
- Illegal status transitions are rejected.
- Stats counts match the data created in Postman and are isolated per user.
- Check-in on a declined attendee → `400`.

---

# PHASE 6: Backend testing in Postman (before any UI)

Goal:** Prove all 17+ endpoints work before touching React.

**Tasks****
1. Build a Postman collection with folders: Auth, Events, Attendees, Special.
2. Use environment variables `baseUrl`, `token`, `eventId`, `attendeeId` and save them via test scripts.
3. For **every** endpoint, write at least: 1 success case, 1 validation failure (`400`), 1 unauthenticated case (`401`), and (where relevant) 1 not-found/not-owned case (`404`).
4. Create two users (A and B) and verify B can never read, edit, or delete A's data.
5. Export the collection JSON into `server/postman/`.
6. Write `server/README.md` documenting each endpoint with example request and response.

**Acceptance criteria:** a checklist table (endpoint × scenario) all marked passing.

---

# PHASE 7: Frontend setup and API layer

**Goal:** React app scaffold with routing and a working API client.

**Tasks**
1. Create with Vite: `npm create vite@latest client -- --template react`. Install `react-router-dom axios` and Tailwind CSS.
2. `services/api.js`: axios instance with `baseURL = import.meta.env.VITE_API_URL`; request interceptor adds `Authorization: Bearer <token>` from localStorage; response interceptor on `401` clears the token and redirects to `/login`.
3. Service files: `authService`, `eventService`, `attendeeService`, `statsService`, one function per endpoint.
4. Set up `App.jsx` routes:
   - Public: `/login`, `/register`
   - Protected: `/` (dashboard), `/events`, `/events/new`, `/events/:id`, `/events/:id/edit`
   - `*` → NotFound
5. `components/ProtectedRoute.jsx` redirects to `/login` if not authenticated.
6. Shared components: `Navbar`, `Loader`, `Toast` (or use a small library), `Pagination`, `StatusBadge`.

**Acceptance criteria:** app runs, routes render placeholders, protected routes redirect when logged out.

---

# PHASE 8: Auth UI and state

**Goal:** Working register/login/logout with persistent session.

**Tasks**
1. `context/AuthContext.jsx`: holds `user`, `token`, `loading`; exposes `login`, `register`, `logout`. On app load, if a token exists call `GET /api/auth/me` to restore the session.
2. `pages/Register.jsx` and `pages/Login.jsx`: controlled forms, client-side validation, loading state on submit, show API error messages, redirect to dashboard on success.
3. Navbar shows the user name and a Logout button when logged in.

**Acceptance criteria**
- Register → auto-login → lands on dashboard.
- Refresh keeps you logged in.
- Logout clears the token and redirects.
- Wrong password shows the server message.

---

# PHASE 9: Events UI

**Goal:** Complete event management screens.

**Tasks**
1. `pages/Events.jsx`: paginated list of `EventCard`s; controls for search box (debounced 400 ms, calls the search API), status filter, category filter, date range, and sort. Filters are kept in URL query params. Empty state and loading skeleton.
2. `pages/EventCreate` / `EventEdit` using a shared `EventForm`: all fields, client validation (end date after start date), inline field errors from the API.
3. `pages/EventDetails.jsx`: event info, a status badge, a **status change control** that only offers valid next statuses, Edit and Delete (with a confirm dialog).
4. Success/error toasts on every action.

**Acceptance criteria:** create, edit, delete, search, filter and paginate all work against the live API; invalid transitions are not offered in the UI.

---

# PHASE 10: Attendees UI

**Goal:** Manage attendees inside the event details page.

**Tasks**
1. In `EventDetails`, add an **Attendees** section with `AttendeeTable`: paginated, RSVP filter, search by name/email.
2. "Add attendee" modal/form and "Edit" modal; delete with confirm.
3. Capacity indicator (e.g. "34 / 50 seats") and disable Add when full.
4. Check-in toggle button per row (enabled only for confirmed attendees on published/ongoing events).
5. RSVP shown as coloured badges.

**Acceptance criteria:** all 5 attendee APIs and the check-in API are usable from the UI; errors like duplicates and capacity show clear messages.

---

# PHASE 11: Dashboard UI

**Goal:** A useful landing page after login.

**Tasks**
1. `pages/Dashboard.jsx` calls `GET /api/stats/dashboard`.
2. Stat cards: total events, upcoming, total attendees, check-in rate.
3. Charts (use `recharts`): events by status (pie/donut), events by category (bar), RSVP breakdown (bar).
4. "Next events" list linking to event details.
5. Empty state prompting the user to create their first event.

**Acceptance criteria:** numbers match Postman results; page handles zero data gracefully.

---

# PHASE 12: Polish, quality, and security pass

**Tasks**
1. Responsive layout (mobile, tablet, desktop); keyboard-accessible forms and modals; labels on inputs.
2. Consistent loading and error states everywhere; a global error boundary.
3. Backend: add `helmet` and `express-rate-limit` (stricter on `/api/auth`); confirm no password or secret leaks in any response or log.
4. Remove `console.log` leftovers; ensure `.env` files are git-ignored.
5. Write the root `README.md`: overview, features, tech stack, setup steps, env variables, API table, screenshots placeholder.

**Acceptance criteria:** Lighthouse/mobile view is usable; a code read shows no hard-coded secrets.

---

# PHASE 13: Deployment (free tier)

**Tasks**
1. **MongoDB Atlas**: create a free M0 cluster, a database user, allow network access (`0.0.0.0/0` for the free setup), copy the connection string.
2. **Render (API)**: new Web Service from the GitHub repo, root directory `server`, build `npm install`, start `npm start`. Set env vars: `MONGO_URI`, `JWT_SECRET` (long random string), `JWT_EXPIRES_IN`, `CLIENT_URL` (Vercel URL, set after step 3), `NODE_ENV=production`. Note: the free tier sleeps after inactivity, so the first request can be slow.
3. **Vercel or Netlify (client)**: root directory `client`, build `npm run build`, output `dist`, env var `VITE_API_URL=https://<render-app>.onrender.com/api`. Add a rewrite so all routes serve `index.html` (`vercel.json` or `_redirects`) to fix React Router refreshes.
4. Update `CLIENT_URL` on Render to the final frontend URL and redeploy.
5. Smoke test in production: register, login, create event, add attendee, check-in, dashboard.

**Acceptance criteria:** live URLs work end to end; no CORS errors; refreshing a nested route does not 404.

---

# Final Checklist

- [ ] 3 Auth + 5 Events + 5 Attendees + 4 Special APIs working
- [ ] All non-public routes protected by auth middleware
- [ ] Every query scoped to the logged-in user
- [ ] Input validation and correct status codes (200, 201, 400, 401, 404, 409)
- [ ] Pagination on all list APIs
- [ ] All APIs tested in Postman before UI
- [ ] React UI: auth, events, attendees, dashboard
- [ ] Deployed: Atlas + Render + Vercel/Netlify
- [ ] README with setup and API docs

---

# Optional Phase 14 (enhancements after everything works)
- Event image upload (Cloudinary free tier)
- Email invitations to attendees (Nodemailer)
- Export attendees to CSV
- Public event page with a shareable link and public RSVP form
- Refresh tokens and password reset
- Unit/integration tests with Jest and Supertest
