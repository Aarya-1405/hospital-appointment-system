# Aarogya Care Hospital: Appointment Management System

A college demo project (fictional hospital, fictional data). Patients browse doctors and book, view and cancel appointments. A doctor view and an admin view are included.

**Stack:** React (Vite) + React Router + Axios · Node.js + Express · MongoDB + Mongoose · bcryptjs + JSON Web Tokens (plain JavaScript)

> **Login and roles:** patients, doctors and admins log in with email and password (bcrypt-hashed passwords + JWT tokens). See `docs/AUTH_UPGRADE.md` for what was added, the rules, and test accounts.
>
> Demo logins (created by `npm run seed`): **Admin** `admin@aarogya.example` / `Admin@123` · **Doctor** `meera.kapoor@aarogya.example` / `Doctor@123` · **Patient** `aarav.mehta@example.com` / `Patient@123`

## 1. Software you need (Windows)
1. **Node.js LTS** (nodejs.org). Check with `node -v` and `npm -v`.
2. **MongoDB Community Server** (tick "Install as a Service") and optionally **MongoDB Compass**. Check by opening Compass and connecting to `mongodb://localhost:27017`.
   - No local MongoDB? Use **MongoDB Atlas** (free): create a cluster, add a database user, allow your IP, copy the connection string and paste it as `MONGO_URI` in `server/.env`.
3. **VS Code** (optional but recommended).

## 2. First-time setup
Open the project folder in VS Code and open **two terminals** (Terminal > New Terminal, then the `+` button).

**Terminal 1: backend** (run inside the `server` folder)
```
cd server
npm install
npm run seed
npm run dev
```
- `npm install` downloads the backend libraries.
- `npm run seed` fills MongoDB with sample departments, doctors and appointments (safe to re-run; it resets the data).
- `npm run dev` starts the API at **http://localhost:5000**. You should see `MongoDB connected` and `API running`.

`server/.env` already exists with local defaults (including a `JWT_SECRET`). If you ever delete it, copy `.env.example` to `.env`.

**Terminal 2: frontend** (run inside the `client` folder)
```
cd client
npm install
npm run dev
```
Open **http://localhost:5173**. Keep both terminals running while you use the site.

## 3. Starting it again later
Make sure MongoDB is running, then `npm run dev` in `server` and `npm run dev` in `client`. Data stays in MongoDB between restarts.

## 4. Pages
| URL | Page |
|---|---|
| `/` | Home |
| `/doctors` | Search and filter doctors |
| `/book` | Patient only: booking form (`?doctor=<id>` preselects a doctor) |
| `/login`, `/register` | Log in / patient sign-up |
| `/my-appointments` | Patient only: own appointments |
| `/doctor-dashboard` | Doctor only: own appointments, mark Completed or Cancelled |
| `/admin` | Admin only: statistics, all appointments with filters, add/edit/deactivate doctors |

## 5. API summary (base: http://localhost:5000/api)
| Method | Route | Purpose |
|---|---|---|
| GET | `/doctors?search=&specialization=&all=true` | List doctors |
| POST / PUT / DELETE | `/doctors`, `/doctors/:id` | Add, edit, deactivate doctor |
| POST | `/auth/register`, `/auth/login` | Sign up (patients) / log in |
| GET | `/auth/me` | Who is logged in |
| GET | `/doctors/all` | Admin only: includes inactive doctors |
| GET | `/departments` | List departments |
| GET | `/appointments/slots?doctorId=&date=` | Free and taken slots |
| POST | `/appointments` | Book (validates on the server) |
| GET | `/appointments?doctorId=&status=` | List appointments (only what your role may see) |
| PATCH | `/appointments/:id/cancel` | Patient cancels |
| PATCH | `/appointments/:id/status` | Doctor sets Completed or Cancelled |
| GET | `/stats` | Dashboard counts |

## 6. Folder structure
```
hospital-appointment-system/
  client/                 React app
    src/components/       Reusable pieces (Navbar, Footer, DoctorCard, tables...)
    src/pages/            One file per page/route
    src/context/          AuthContext.jsx (who is logged in)
    src/services/         api.js (Axios calls) and format.js (date/time helpers)
    src/App.jsx           Routes
    src/main.jsx          Starts React
    src/index.css         All styling
  server/
    config/db.js          MongoDB connection
    models/               Doctor, Appointment, Department, User (Mongoose schemas)
    middleware/auth.js    protect + allowRoles (login and role checks)
    controllers/          The logic for each API call
    routes/               Which URL goes to which controller
    utils/dates.js        Date helpers and error helper
    seed.js               Sample data
    server.js             Starts Express
  docs/GUIDE.md           Full explanation, demo script, viva questions
```

## 7. Troubleshooting
| Problem | Fix |
|---|---|
| `MongoDB connection failed` / `ECONNREFUSED` | MongoDB is not running. Press Win+R, run `services.msc`, start **MongoDB Server**. Or switch to Atlas. |
| Website shows "Cannot reach the server" | Backend is not running or not on port 5000. Start it in `server` with `npm run dev`. |
| `EADDRINUSE: port 5000` | Another program uses the port. Change `PORT` in `server/.env` and set `VITE_API_URL` in `client/.env` to match. |
| `'npm' is not recognized` | Reinstall Node.js, then reopen VS Code. |
| No doctors on the site | You skipped `npm run seed` in `server`. |
| `JWT_SECRET is missing` | Add `JWT_SECRET=...` to `server/.env` and restart the server. |
| Cannot log in with demo accounts | Run `npm run seed` again in `server` (it recreates the accounts). |
| Slot says already booked | That is the duplicate-booking protection working. Choose another slot or cancel the existing booking first. |
| Changed `.env` but nothing happened | Stop and restart the server or Vite. |

## 8. Testing status
The code was syntax-checked, but it has **not been run end to end** against a live MongoDB. Follow the checklist in `docs/GUIDE.md` (section F) after setup to confirm each feature on your machine.

## 9. Run with Docker

1. Create a `.env` file in the project root (never commit it):
cho “JWT_SECRET=$(openssl rand -hex 32)” > .env

2. Build and start everything:

docker compose up -d --build

3. Load sample data (first time only, safe to re-run):

docker compose exec server npm run seed
4. Open http://localhost:5173 (frontend) and http://localhost:5000/api/doctors (API).
5. Stop: `docker compose down` (add `-v` to also wipe the database).
