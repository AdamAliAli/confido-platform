# Confido Platform

Production-oriented monorepo with a Next.js admin/editor, NestJS API, PostgreSQL, Redis, JWT authentication, role-based authorization, validation, and Docker/Nginx load balancing.

## Local start

1. Copy `.env.example` to `.env` and replace every secret.
2. Run `docker compose up --build`.
3. Open `http://localhost:8080`; admin is at `/admin`.

For Railway, create PostgreSQL and Redis services, deploy `apps/api` and `apps/web` as separate services, set the variables from `.env.example`, and use at least two API replicas when traffic requires it. Railway's edge distributes traffic between replicas; the included Nginx configuration is for self-hosted Docker deployments.
