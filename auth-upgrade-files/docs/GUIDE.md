# Project Guide: Explanation, Demo Script and Viva Prep

## A. Project overview
**What it does:** an online appointment system for a fictional hospital. **Problem solved:** patients no longer need to call or queue to find a doctor and a free time; the system shows only free slots and prevents double booking.

- **Patient:** browse/search doctors, book a slot, view bookings by name, cancel.
- **Doctor (demo):** pick a doctor, see Today / Upcoming / Earlier appointments, mark Completed or Cancelled.
- **Admin (demo):** live statistics, all appointments with doctor/status filters, add/edit/deactivate doctors.

> **Updated:** the project now has real login and role-based access control. Read `docs/AUTH_UPGRADE.md` alongside this guide; where this guide mentions "demo views" or "no login", the upgrade replaces that.

Each of the three sections is now protected by login and role checks.

## B. Technologies
| Tech | What it is | Why / where used |
|---|---|---|
| HTML | Page structure | Rendered through JSX; `client/index.html` is the single page that React fills. |
| CSS | Styling | `client/src/index.css` (colors in `:root` variables, responsive via `@media`). |
| JavaScript (ES6+) | The language of the whole project | Frontend, backend and seed script. Uses arrow functions, `async/await`, destructuring, `map/filter`. |
| React | Library for building UIs from components | `client/src/*`. Pages and components re-render when state changes. |
| Vite | Dev server and bundler for React | `npm run dev` in `client`; config in `vite.config.js`. |
| React Router | Page navigation without reloading | `App.jsx` (routes), `Navbar.jsx` (links), `useSearchParams` in pages. |
| Axios | Sends HTTP requests from React | `client/src/services/api.js`. |
| Lucide React | Icon set | Navbar, cards, buttons. |
| Node.js | Runs JavaScript outside the browser | Runs the backend and npm. |
| Express | Web framework for Node | `server/server.js`, `routes/`, `controllers/`. |
| REST API | URLs + HTTP methods (GET, POST, PUT, PATCH, DELETE) that return JSON | All `/api/...` routes. |
| MongoDB | Document database | Stores doctors, departments, appointments. |
| Mongoose | Describes MongoDB data (schemas) and queries it | `server/models/*`, queries in controllers. |
| CORS | Allows the browser app on port 5173 to call the API on port 5000 | `cors()` in `server.js`. |
| dotenv | Reads `.env` settings | `server/.env` holds the MongoDB address and port. |

How they connect: **React page → Axios → Express route → controller → Mongoose model → MongoDB**, then JSON travels back the same way.

## C. Files and folders
- `client/index.html`: the one HTML page. Contains `<div id="root">`.
- `client/src/main.jsx`: starts React and wraps the app in `BrowserRouter`.
- `client/src/App.jsx`: shows Navbar, the page matching the URL, and Footer.
- `client/src/index.css`: all styles.
- `components/`: small reusable pieces used by many pages (`DoctorCard`, `AppointmentTable`, `Navbar`, `Feedback` for loader/alerts/empty states, `Avatar`).
- `pages/`: one file per screen (`Home`, `Doctors`, `Book`, `MyAppointments`, `DoctorDashboard`, `AdminDashboard`).
- `services/api.js`: every backend call in one place. `services/format.js`: date/time display helpers.
- `server/server.js`: creates the Express app, connects routes and the error handler, starts listening.
- `server/models/`: the shape and validation rules of each MongoDB collection.
- `server/routes/`: maps a URL + method to a controller function.
- `server/controllers/`: the real logic (booking rules, cancellation, statistics).
- `server/seed.js`: inserts the fictional sample data.
- `package.json`: project name, scripts (`npm run dev`) and the list of libraries. `npm install` reads it.
- `.env`: settings that change per computer (database address, port). Not committed to Git (see `.gitignore`).

**Finding a feature:** booking form = `pages/Book.jsx` + `appointmentController.bookAppointment`. Slot checking = `getSlots` in `appointmentController.js`. Statistics = `miscController.dashboardStats`. Search = `pages/Doctors.jsx` + `doctorController.listDoctors`.

## D. Code walkthrough
**`server/models/Appointment.js`:** fields `patientName, email, phone, doctor (reference to a Doctor), date ("YYYY-MM-DD"), time ("HH:MM"), reason, status (Booked/Completed/Cancelled)`. Validation messages come from here (e.g. invalid email). Dates are stored as text so comparing `"2026-10-12" < "2026-10-13"` just works.

**`server/controllers/appointmentController.js`:**
- `getSlots(doctor, date)`: rejects invalid/past dates, checks the doctor works that weekday, then asks MongoDB for appointments of that doctor on that date whose status is **not** `Cancelled` (`status: { $ne: 'Cancelled' }`). Each doctor slot becomes `{ time, available }`. Slots already passed today are unavailable.
- `bookAppointment`: checks required fields → doctor exists and is active → `getSlots` → the requested slot exists and is free (otherwise **409 Conflict**) → saves. **This is the duplicate-booking prevention, and it runs on the server**, not only in React.
- `cancelAppointment`: only a `Booked` appointment can be cancelled; status becomes `Cancelled`, so the slot query ignores it and the slot is free again.
- `updateStatus`: doctor sets `Completed` or `Cancelled`; a cancelled one cannot be changed.
- `listAppointments`: builds a filter object from query parameters (`doctorId`, `status`, `patientName`) and uses `.populate('doctor')` to replace the doctor id with name and specialization.

**`server/controllers/doctorController.js`:** list (with regex search and specialization filter), add, update, and `deactivateDoctor`, which sets `isActive: false` instead of deleting so old appointments still show their doctor.

**`server/controllers/miscController.js`:** `dashboardStats` runs five `countDocuments` queries (`Promise.all`) so every number is live from the database.

**`server/server.js`:** `app.use(cors())`, `app.use(express.json())`, mounts the routes under `/api`, and has one error handler that returns `{ message }` JSON. Validation errors become status 400.

**`client/src/services/api.js`:** one Axios instance with the base URL; one small function per API call; `errMsg(e)` turns errors into readable text.

**`pages/Book.jsx`:**
- State (`useState`): `form`, `slots`, `errors`, `serverError`, `booked`.
- `useEffect` on `[form.doctor, form.date]` calls the slots API whenever either changes, and clears the chosen time.
- `validate()` checks required fields, email/phone format and past dates before sending.
- `submit()` calls `bookAppointment`; on success shows the confirmation card; on error (e.g. slot just taken) shows the server's message and reloads the slots.
- Props/URL: the doctor card links to `/book?doctor=<id>`, read with `useSearchParams`.

**`components/DoctorCard.jsx`:** receives a `doctor` **prop** and displays it. Used on Home and Doctors pages. **`AppointmentTable.jsx`** receives `items` and an optional `renderActions` function, so the patient, doctor and admin pages reuse one table with different buttons.

**`pages/Doctors.jsx`:** `search` and `specialization` state; an effect re-fetches (with a 250 ms delay while typing) and the backend filters in MongoDB.

**`pages/MyAppointments.jsx`:** the chosen name lives in the URL (`?name=`). Cancel asks for confirmation, calls the cancel API, then reloads the list.

**`pages/DoctorDashboard.jsx`:** loads appointments for the selected doctor and splits them by comparing each `date` with today's date into Today / Upcoming / Earlier. Buttons call `setAppointmentStatus` and reload.

**`pages/AdminDashboard.jsx`:** loads stats and doctors; the form state is `null` (hidden) or a doctor object; Add uses POST, Edit uses PUT, Deactivate uses DELETE (soft), Activate uses PUT `{ isActive: true }`. Appointment filters are sent as query parameters.

## E. Booking flow
```
Patient opens /doctors → clicks "Book appointment" → /book?doctor=ID
   → picks date  ──► GET /api/appointments/slots  ──► Express ──► MongoDB (taken slots) ──► free/taken list
   → picks slot, clicks "Confirm appointment"
   → React validates ──► POST /api/appointments (Axios, JSON body)
        Express route → controller:
          required fields? doctor active? date not past? doctor works that day?
          slot exists? slot still free?  (409 if not)
        Mongoose saves → MongoDB stores document
   ◄── 201 + saved appointment (or error message)
   → React shows "Appointment booked" card
```

## F. Demo script and test checklist
1. **Home:** show hero, live counts (from the database), featured doctors, departments. Click the *Cardiology* department → Doctors page opens filtered.
2. **Doctors:** type `Sunita` (search), clear, choose *Dermatology* (filter).
3. **Book:** click *Book appointment* on any card. Submit empty → validation errors. Enter name `Demo Patient`, email `demo@example.com`, phone `9876543210`, choose a date (try a past date: blocked; try a weekday the doctor does not work: message shown), pick an available slot, add a reason, confirm → success card.
4. **Duplicate prevention:** book the same doctor/date again: that slot is now struck out. Show it in Compass too.
5. **My appointments:** pick `Demo Patient`, show the booking, click *Cancel appointment*, confirm. Go back to Book: the slot is free again.
6. **Doctor view:** choose the doctor you booked, show Today/Upcoming, click *Mark completed*.
7. **Admin:** show the five statistics changing after steps 3 to 6. Filter appointments by doctor and status. *Doctors* tab: add a doctor, edit it, deactivate it, then check it disappears from the public Doctors page.
8. **Restart test:** stop and restart both servers; data is still there.

## G. Viva questions
1. **Why React?** It builds the UI from reusable components and updates only what changes, so pages stay fast and code stays organized.
2. **What is JavaScript used for here?** Everything: UI logic in React, the server in Node, and the seed script.
3. **What is Node.js?** A runtime that lets JavaScript run outside the browser, on the server.
4. **What is Express?** A Node framework that receives HTTP requests and sends responses using routes.
5. **What is MongoDB?** A NoSQL database that stores data as JSON-like documents in collections.
6. **What is Mongoose?** A library that defines schemas/models for MongoDB, adds validation and simple query methods.
7. **What is a REST API?** A set of URLs where HTTP methods mean actions: GET read, POST create, PUT/PATCH update, DELETE remove, usually returning JSON.
8. **What is Axios?** A library for sending HTTP requests from React to the API.
9. **Frontend vs backend?** Frontend runs in the browser and handles what the user sees; backend runs on the server, applies rules and talks to the database.
10. **How does data reach the database?** Form → React state → Axios POST → Express route → controller → Mongoose → MongoDB.
11. **How does booking work?** Pick doctor and date, see free slots, submit; the server validates everything and saves with status Booked.
12. **How is duplicate booking prevented?** The server queries for a non-cancelled appointment with the same doctor, date and time and returns 409 if found; the UI also hides taken slots.
13. **What happens on cancellation?** Status becomes Cancelled; availability queries ignore cancelled appointments so the slot frees up.
14. **What are components and props?** Components are reusable UI functions; props are the inputs passed to them (e.g. `doctor` to `DoctorCard`).
15. **What are hooks?** Functions like `useState` (store changing data) and `useEffect` (run code on load or when values change).
16. **What does React Router do?** Maps URLs to pages and switches pages without a full reload.
17. **What is CORS?** A browser rule restricting cross-origin requests; the `cors` package allows our frontend to call the backend.
18. **Why a `.env` file?** To keep settings such as the database address outside the code.
19. **Why deactivate instead of deleting a doctor?** Existing appointments still reference that doctor.
20. **What are the limitations?** No real authentication, so views are open to everyone; a very simultaneous double-click race is not locked at database level (a unique index could be added); single-hospital demo scale.

## H. Abstract and key features (for your report)
**Abstract:** The Hospital Appointment Management System is a full-stack web application that lets patients search doctors by name and specialization, view real-time slot availability and book, view and cancel appointments online. Doctors can review and update the status of their appointments, and administrators can manage doctors and monitor hospital statistics computed live from the database. The system is built with React, Express, Node.js and MongoDB, exposes a REST API, and validates all booking rules on the server to prevent past-date and double bookings.

**Key features:** responsive modern UI · doctor search and specialization filter · live slot availability · server-side duplicate and past-date prevention · cancellation that frees slots · doctor dashboard (today/upcoming, mark completed/cancelled) · admin dashboard with live statistics, filters and doctor management (add/edit/deactivate) · seed script with fictional data · loading, error and empty states.
