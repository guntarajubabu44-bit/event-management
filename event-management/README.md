# Tickety Event Management

A React and Express platform for discovering and booking events across India. The app supports customer, organizer, and admin accounts, MongoDB persistence, organizer event management, public event discovery, ticket reservations, manual UPI references, and optional Razorpay checkout.

## Run locally

Requirements: Node.js 20.19+ and MongoDB 7+ (local or Atlas).

1. Install dependencies with `npm install` in `client` and `server`.
2. Copy `server/.env.example` to `server/.env`. Set a private `JWT_SECRET` (at least 32 random characters for production) and `MONGO_URI`.
3. Start MongoDB. In `server`, run `npm run dev`.
4. In another terminal, run `npm run dev` in `client` and open the Vite URL.

The client API URL defaults to the same-origin `/api` path. During local development, Vite proxies API requests to `http://127.0.0.1:5000`, so signup and other API calls work both at `localhost:5173` and when opening the Vite network URL on another device. If the deployed API uses a different origin, set `VITE_API_URL` in `client/.env` and allow the client origin with `CLIENT_URL` on the server. `GET /api/health` reports API and MongoDB connectivity. Categories are seeded when the server starts.

## External services

- Razorpay test/live keys enable online payment orders, signature verification, capture, and webhook updates. Configure `RAZORPAY_WEBHOOK_SECRET` and set the gateway webhook URL to `/api/webhooks/razorpay`.
- SMTP settings enable email OTP sign-in, password reset, booking email delivery, and optional contact inquiry email forwarding (set `CONTACT_EMAIL`). Without SMTP, local non-production runs show a temporary email sign-in code in the login screen; production requires SMTP and never returns the code in the API response. Development password reset also returns a temporary token when SMTP is unavailable.
- Phone OTP sign-in uses the MSG91 Flow API. Set `MSG91_AUTH_KEY` and `MSG91_TEMPLATE_ID` in `server/.env` and configure an approved template with an `OTP` variable; Indian SMS delivery may also require DLT registration. Without MSG91, local non-production runs show a temporary test code in the login screen; production requires MSG91 and never returns the code in the API response.
- Cloudinary credentials enable event image uploads. Event image URLs can also be entered directly.
- Manual UPI payment references can be recorded for organizer verification when online checkout is not configured.

## Accounts and permissions

Registration creates customer accounts by default; the registration form also offers organizer accounts. Create an admin by registering the account first, then run `npm run promote-admin -- person@example.com` in `server`. Do not expose admin promotion publicly.

Organizers manage only their events and bookings. Admins can manage platform events, customers, bookings, and categories. Customers can browse public events, book, and review their booking and payment history.

## Implemented areas

- Indian customer registration, email and phone OTP sign-in, JWT sessions, role permissions, password recovery, and Indian state/city selection.
- Organizer event creation/editing, up to ten event images, seat availability, categories, attendee lists, and check-in.
- Public event search, category/city/state/date/price filters, galleries, event details, and booking.
- Booking references, seat reservation, advance/balance calculations, manual payment verification, Razorpay checkout hooks, email notification hooks, payment history, and printable verified-payment receipts.
- Customer, organizer, and admin dashboards; customer activation; booking operations; event category administration.
- About and contact pages with a rate-limited contact form stored for admin review.

## Verification

From `client`, run `npm run build` and `npm run lint`. The lint command reports existing React hook and Fast Refresh warnings. From `server`, run `node --check server.js`. The application requires working MongoDB and optional external credentials for live image hosting, gateway payments, and email. Configure and test those services in their sandbox accounts before public launch.

## Deploy

Build the client with `npm run build`; deploy `client/dist` as a static site and run the API with `npm start`. Set `NODE_ENV=production`, `MONGO_URI`, a strong `JWT_SECRET`, `CLIENT_URL`, and the matching client `VITE_API_URL`. Keep MongoDB network access limited to the API host, and never commit `.env` files or production credentials.
