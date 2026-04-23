# UX Research Tool

Internal web application for running lightweight UX research exercises (Treejack and Closed Card Sort).

## Prerequisites

- Node.js v18 or higher (tested on v24)
- npm v9 or higher

> **Note:** `better-sqlite3` is a native addon and must be compiled or have a prebuilt binary available for your Node version. If `npm install` fails with a node-gyp error, ensure you have Xcode Command Line Tools installed (`xcode-select --install`) and try again.

## Install dependencies

Install all dependencies (root, client, and server) in one step:

```bash
npm run install:all
```

Or install each workspace manually:

```bash
# Root (concurrently)
npm install

# Client
npm install --prefix client

# Server
npm install --prefix server
```

## Run in development

Start both the client and server together from the project root:

```bash
npm run dev
```

- Client: http://localhost:5173
- Server: http://localhost:3001

## Run client and server separately

In one terminal:

```bash
npm run dev --prefix server
```

In another terminal:

```bash
npm run dev --prefix client
```

## API health check

```
GET http://localhost:3001/api/health
→ { "status": "ok" }
```

## Project structure

```
ux-research-tool/
├── client/          # Vite + React frontend
│   ├── src/
│   │   ├── main.jsx
│   │   └── App.jsx
│   ├── index.html
│   └── package.json
├── server/          # Express API
│   ├── index.js
│   ├── .env
│   └── package.json
├── package.json     # Root workspace scripts
└── README.md
```

The SQLite database file (`db.sqlite`) is created at runtime in the project root when the database layer is initialised.
