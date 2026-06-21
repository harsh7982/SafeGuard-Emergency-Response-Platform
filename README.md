# SafeHer Frontend (React + Vite)

## Quick Start

### Prerequisites

* Node.js 20+
* npm 10+

### Install and Run

```bash
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173`

### Build and Lint

```bash
npm run lint
npm run build
```

## Backend Connection

Create `.env` in frontend root with:

```env
VITE_API_URL=http://localhost:8080
```

Restart frontend after changing `.env`.

## Full-stack Run

1. Start backend from `women-safety-backend`:

```bash
mvn spring-boot:run
```

2. Start frontend from `women-safety-frontend`:

```bash
npm run dev
```

## VS Code Workspace

Open this workspace file to load frontend + backend together:

`safeher-fullstack.code-workspace`
