# Expense Tracker

A full-stack expense tracking app built with **Next.js 14**, **MongoDB**, and **NextAuth.js** authentication.

## Features

- 📊 Track expenses in multiple currencies
- 💱 Live exchange rate conversion via exchangerate-api.com
- 🔐 Credential-based authentication (register / login / logout)
- 🐳 Docker-ready with standalone Next.js build

---

![Expense Tracker](public/reactjs-nextjs.png)

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB (local or Atlas)

### Local Development

1. **Clone and install dependencies**

   ```bash
   git clone <repo-url>
   cd expense-tracker
   npm install
   ```

2. **Configure environment variables**

   Copy the example file and fill in your values:

   ```bash
   cp .env.local.example .env.local
   ```

   ```env
   MONGODB_URI=mongodb://localhost:27017/expense-tracker
   AUTH_SECRET=your-secret-here        # generate: openssl rand -base64 32
   AUTH_URL=http://localhost:3000
   ```

3. **Run the development server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

---

## Docker

### Build the image

```bash
docker build -t expense-tracker .
```

### Run the container

```bash
docker run -p 3000:3000 \
  -e MONGODB_URI="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority" \
  -e AUTH_SECRET="your-secret-here" \
  -e AUTH_URL="http://localhost:3000" \
  expense-tracker
```

> **Tip:** Generate a secure `AUTH_SECRET` with:
> ```bash
> openssl rand -base64 32
> ```

### Using Docker Compose (recommended)

Create a `docker-compose.yml`:

```yaml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      MONGODB_URI: "mongodb://mongo:27017/expense-tracker"
      AUTH_SECRET: "your-secret-here"
      AUTH_URL: "http://localhost:3000"
    depends_on:
      - mongo

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

Then run:

```bash
docker compose up
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `AUTH_SECRET` | ✅ | Secret for signing JWT session tokens |
| `AUTH_URL` | ✅ | Base URL of the app (used by NextAuth for redirects) |

---

## Project Structure

```
app/
├── api/
│   ├── auth/
│   │   ├── [...nextauth]/   # NextAuth route handler
│   │   └── register/        # User registration endpoint
│   └── expenses/            # CRUD expense endpoints
├── components/
│   ├── ExpenseForm.tsx
│   └── Providers.tsx        # SessionProvider wrapper
├── lib/
│   ├── auth.ts              # NextAuth config
│   └── mongodb.ts           # Mongoose connection
├── models/
│   ├── Expense.ts
│   └── User.ts
├── login/                   # Login page
├── register/                # Register page
└── page.tsx                 # Main dashboard
middleware.ts                # Route protection
```

---

## Authentication Flow

1. Register at `/register` — creates a hashed-password account in MongoDB
2. Login at `/login` — issues a JWT session cookie via NextAuth
3. All routes except `/login` and `/register` are protected by middleware
4. All `/api/expenses` endpoints require a valid session
5. Logout button on the dashboard clears the session and redirects to `/login`

