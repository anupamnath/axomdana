# Axom Dana LLC - Full-Stack E-Commerce Store

**Axom Dana LLC** is a premium e-commerce platform based in **Beharbari, Guwahati, Assam, India**. Built with React, Node.js/Express, and PostgreSQL, it provides a complete online shopping experience with secure checkout and order management.

**Live Site:** [https://axomdana.in](https://axomdana.in)

## Features

- **User Authentication** — Register, login, and JWT-based session management
- **Product Catalog** — Browse products with category filtering, search, and pagination
- **Shopping Cart** — Add/remove items, update quantities, real-time total calculation
- **Order Management** — Place orders, view order history, detailed order summaries
- **Responsive UI** — Clean, modern design that works on desktop and mobile
- **SSL Security** — Full HTTPS with Let's Encrypt auto-renewal
- **Dockerized** — Containerized deployment with Docker Compose

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | React 18, React Router 6, Axios    |
| Backend     | Node.js, Express 4                  |
| Database    | PostgreSQL 16                       |
| Auth        | JWT (JSON Web Tokens), bcryptjs     |
| Proxy       | Nginx (reverse proxy + SSL)         |
| SSL         | Let's Encrypt (Certbot)             |
| Container   | Docker & Docker Compose             |

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/        # Database connection, migrations, seed data
│   │   ├── middleware/     # Auth middleware (JWT verification)
│   │   ├── routes/        # API route handlers (auth, products, cart, orders)
│   │   └── index.js       # Express app entry point
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components (Navbar, ProtectedRoute)
│   │   ├── context/       # React context providers (Auth, Cart)
│   │   ├── pages/         # Page components (Home, Product, Cart, Checkout, Orders)
│   │   ├── services/      # API client (Axios instance with interceptors)
│   │   ├── App.jsx        # Root component with routing
│   │   └── main.jsx       # App entry point
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   └── nginx.conf          # Production Nginx config with SSL
├── scripts/
│   └── init-ssl.sh         # One-time SSL certificate setup
├── docker-compose.yml       # Development setup
├── docker-compose.prod.yml  # Production setup with SSL
├── .env.prod.template       # Production environment variables template
└── README.md
```

## Quick Start (Development)

```bash
# Start PostgreSQL
docker compose up postgres -d

# Backend
cd backend
npm install
npm run migrate
npm run seed
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`

## Production Deployment

### Prerequisites

- A server with Docker and Docker Compose installed
- Domain `axomdana.in` pointing to your server's public IP
- Ports 80 and 443 open in your firewall

### Step 1: Clone and Configure

```bash
git clone <your-repo-url> /opt/axomdana
cd /opt/axomdana

# Create production environment file
cp .env.prod.template .env
# Edit .env with strong random passwords:
#   - Generate DB password: openssl rand -base64 32
#   - Generate JWT secret:  openssl rand -base64 64
nano .env
```

### Step 2: Start Services

```bash
# Start all services (PostgreSQL, Backend, Frontend)
docker compose -f docker-compose.prod.yml up -d postgres backend frontend
```

### Step 3: Initialize SSL Certificate

```bash
# Run the SSL initialization script
chmod +x scripts/init-ssl.sh
./scripts/init-ssl.sh
```

This will:
1. Start Nginx to serve the ACME challenge
2. Request a Let's Encrypt certificate for `axomdana.in` and `www.axomdana.in`
3. Reload Nginx with the new certificates
4. Set up automatic renewal (certbot checks every 12 hours)

### Step 4: Start Full Production Stack

```bash
# Start Nginx with SSL
docker compose -f docker-compose.prod.yml up -d nginx

# Verify everything is running
docker compose -f docker-compose.prod.yml ps
```

### Updating the Application

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build backend frontend
docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## API Endpoints

### Authentication

| Method | Endpoint           | Description        | Auth Required |
|--------|--------------------|--------------------|---------------|
| POST   | `/api/auth/register` | Register a new user | No            |
| POST   | `/api/auth/login`    | Login              | No            |
| GET    | `/api/auth/me`       | Get current user   | Yes           |

### Products

| Method | Endpoint                  | Description            | Auth Required |
|--------|---------------------------|------------------------|---------------|
| GET    | `/api/products`           | List products (paginated, filterable) | No  |
| GET    | `/api/products/categories`| Get all categories     | No            |
| GET    | `/api/products/:slug`     | Get product by slug    | No            |

### Cart

| Method | Endpoint       | Description          | Auth Required |
|--------|----------------|----------------------|---------------|
| GET    | `/api/cart`    | Get user's cart      | Yes           |
| POST   | `/api/cart`    | Add item to cart     | Yes           |
| PUT    | `/api/cart/:id`| Update item quantity | Yes           |
| DELETE | `/api/cart/:id`| Remove item from cart| Yes           |

### Orders

| Method | Endpoint         | Description       | Auth Required |
|--------|------------------|-------------------|---------------|
| GET    | `/api/orders`    | List user orders  | Yes           |
| GET    | `/api/orders/:id`| Get order details | Yes           |
| POST   | `/api/orders`    | Create new order  | Yes           |

## Environment Variables

### Production (`docker-compose.prod.yml` via `.env`)

| Variable        | Description                  | Required |
|-----------------|------------------------------|----------|
| `DB_USER`       | PostgreSQL username          | No (default: axomdana_user) |
| `DB_PASSWORD`   | PostgreSQL password          | **Yes**  |
| `DB_NAME`       | PostgreSQL database name     | No (default: axomdana_db) |
| `JWT_SECRET`    | JWT signing secret           | **Yes**  |
| `JWT_EXPIRES_IN`| Token expiration duration    | No (default: 7d) |

### Development (`backend/.env`)

| Variable        | Description                  | Default                                      |
|-----------------|------------------------------|----------------------------------------------|
| `PORT`          | Server port                  | `5000`                                       |
| `DATABASE_URL`  | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db`    |
| `JWT_SECRET`    | JWT signing secret           | *(change in production)*                      |
| `JWT_EXPIRES_IN`| Token expiration duration    | `7d`                                         |

## Security

- All traffic is encrypted via **Let's Encrypt SSL** (auto-renewed)
- Passwords are hashed with **bcrypt** (10 salt rounds)
- JWT tokens are signed with a server-side secret
- Database is only accessible internally (port 5432 bound to 127.0.0.1)
- Nginx includes security headers (HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)

## License

© 2026 Axom Dana LLC. Beharbari, Guwahati, Assam, India. All rights reserved.
