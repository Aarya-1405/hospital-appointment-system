# Login and Access Control Upgrade

## What was added and why (short)
| Added | Why |
|---|---|
| **User accounts** (`models/User.js`) with a `role`: patient, doctor, admin | One place that says who a person is and what they may do. |
| **Password hashing** (`bcryptjs`) | Passwords are stored as one-way hashes, never as readable text. |
| **Login token** (`jsonwebtoken`) | After login the server gives the browser a signed token. The browser sends it with every request so the server knows who is asking. |
| **`protect` and `allowRoles` middleware** (`middleware/auth.js`) | The real security. Routes now reject people who are not logged in or have the wrong role, even if they call the API directly. |
| **Data scoping** in `appointmentController` | A patient only receives their own appointments, a doctor only their own patients', an admin everything. Name and email on a booking come from the account, so nobody can book as someone else. |
| **Auth context + `ProtectedRoute`** (frontend) | Remembers who is logged in and blocks pages for the wrong role. This is only for a good user experience; the backend does the real blocking. |
| **Login and Register pages** | Patients can self-register. Doctors and admins cannot (admin creates doctor logins when adding a doctor). |
| **Role-based navbar** | Each user sees only the links they can use. |

## Rules now enforced
| Action | Patient | Doctor | Admin |
|---|---|---|---|
| Browse doctors / departments | yes (also logged out) | yes | yes |
| Book appointment | yes | no | no |
| View appointments | own only | own patients only | all |
| Cancel appointment | own only | no | yes (API) |
| Mark Completed / Cancelled | no | own only | yes (API) |
| Dashboard statistics | no | no | yes |
| Add / edit / deactivate doctors | no | no | yes |

## Step-by-step: where to add it
Easiest way: **unzip `auth-upgrade-files.zip` on top of your project folder** (choose "Replace" for existing files). It contains only the new and changed files with the same folder paths. Then follow steps 1 to 5.

### Step 1: New backend files (create these)
- `server/models/User.js`
- `server/middleware/auth.js` (new folder `middleware`)
- `server/controllers/authController.js`
- `server/routes/authRoutes.js`

### Step 2: Replace or edit these backend files
- `server/server.js`: stops if `JWT_SECRET` is missing, mounts `/api/auth`, handles duplicate-email errors.
- `server/models/Appointment.js`: new `patient` field linking to the User.
- `server/controllers/appointmentController.js`: booking uses the logged-in user; list, cancel and status checks by role.
- `server/controllers/doctorController.js`: `listAllDoctors` and creating a doctor login.
- `server/routes/doctorRoutes.js`, `appointmentRoutes.js`, `miscRoutes.js`: add `protect` and `allowRoles`.
- `server/seed.js`: also creates demo accounts.

### Step 3: Install the two new backend libraries
In **Terminal 1, inside `server`**:
```
npm install bcryptjs jsonwebtoken
```
Then open `server/.env` and **add these two lines** (the zip does not overwrite your `.env`):
```
JWT_SECRET=change-this-to-a-long-random-text-for-your-laptop
JWT_EXPIRES=1d
```
Re-create the sample data (this **resets** the database and adds the accounts):
```
npm run seed
npm run dev
```

### Step 4: New frontend files (create these)
- `client/src/context/AuthContext.jsx`
- `client/src/components/ProtectedRoute.jsx`
- `client/src/pages/Login.jsx`
- `client/src/pages/Register.jsx`

### Step 5: Replace or edit these frontend files
`client/src/main.jsx`, `App.jsx`, `index.css` (new styles are added at the bottom), `services/api.js`, `components/Navbar.jsx`, `pages/Book.jsx`, `pages/MyAppointments.jsx`, `pages/DoctorDashboard.jsx`, `pages/AdminDashboard.jsx`.

No new frontend libraries are needed. Restart the frontend (`npm run dev` in `client`) and **hard refresh** the browser.

## Demo accounts (created by `npm run seed`)
| Role | Email | Password |
|---|---|---|
| Admin | admin@aarogya.example | Admin@123 |
| Doctor | meera.kapoor@aarogya.example | Doctor@123 |
| Patient | aarav.mehta@example.com | Patient@123 |

Every doctor uses `firstname.lastname@aarogya.example` with `Doctor@123`. Every sample patient uses `Patient@123` (others: priya.nair@example.com, rohan.iyer@example.com, sneha.k@example.com). The Login page has buttons that fill these in. Remove that box before using this anywhere real.

## Test checklist
- [ ] Logged out: Doctors page works; opening `/book` sends you to Login, and after login you return to `/book`.
- [ ] Patient login: navbar shows Book and My appointments. `/admin` shows "Access denied".
- [ ] Patient books an appointment: name and email are locked to the account. My appointments shows only that patient's bookings. Cancel works.
- [ ] Doctor login: lands on My dashboard showing only their own appointments. Mark completed works. `/admin` shows "Access denied".
- [ ] Admin login: statistics, appointment filters, add doctor (with login email and password), edit, deactivate. Log in as the new doctor to confirm it works.
- [ ] Deactivate a doctor, then try logging in as that doctor: blocked.
- [ ] Register a new patient account and log in; registering an existing email shows an error.
- [ ] Log out, then refresh: you stay logged out. Log in, refresh: you stay logged in.
- [ ] Extra viva demo: open the browser dev tools, copy a patient's request to `/api/stats` and see **403** (the server blocks it, not just the page).

## Viva answers for the new part
- **Authentication vs authorization?** Authentication proves who you are (login). Authorization decides what you may do (roles).
- **Why hash passwords?** If the database leaks, attackers still cannot read passwords. bcrypt is slow on purpose and adds a random salt.
- **What is a JWT?** A signed text token containing the user id and role. The server verifies the signature, so it cannot be forged without the secret.
- **Why check roles on the backend too?** Anyone can call the API without our website. Frontend checks only hide pages; backend checks protect data.
- **Why is the secret in `.env`?** Anyone who knows it could forge tokens, so it stays out of the code and out of Git.

## Limitations (mention honestly in your report)
- The token is kept in browser `localStorage`. This is fine for a college project; production sites usually use secure HttpOnly cookies.
- There is no password reset, email verification, or login attempt limiting.
- A deactivated doctor who is already logged in keeps access until the token expires; new logins are blocked.
