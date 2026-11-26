# Tickety

Tickety is an Indian event booking platform with customer, organizer, and admin workspaces. The full setup guide, environment configuration, available features, and deployment steps are in [event-management/README.md](event-management/README.md).

## Local setup

Install dependencies in `event-management/client` and `event-management/server`, configure `event-management/server/.env`, start MongoDB and the API, then start the Vite client. The API uses MongoDB; online payments, image uploads, and email require their respective provider credentials.
