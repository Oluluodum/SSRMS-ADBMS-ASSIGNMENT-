# Secure Student Records Management System (SSRMS)

BIT3360 Advanced Databases · Zambia University College of Technology (ZUT)

This academic prototype demonstrates application authentication/RBAC alongside PostgreSQL grants, safe ORM queries, and append-only application audit events. All bundled records and credentials are fictional.

## Architecture

Browser (HTML/CSS/vanilla JS) → same-origin Express JSON API → Prisma Client → PostgreSQL. Express uses bcrypt-verified passwords and a short-lived JWT in an HttpOnly, SameSite=Strict cookie. The runtime PostgreSQL login is a non-superuser with only the table rights the app needs. Express enforces per-user permissions; the SQL demonstration roles are separate PostgreSQL principals for direct SQL testing.

The app's single runtime DB account means database privileges do **not** vary based on the logged-in user. Do not describe application RBAC as PostgreSQL role enforcement. `database/roles.sql` and `database/permissions.sql` demonstrate DB privileges independently.

## Requirements

- Node.js 24 LTS and npm
- PostgreSQL 16+ and `psql` (or pgAdmin)
- Postman is optional for API testing

Check with `node --version`, `npm --version`, and `psql --version`. The package engine expects Node 24.x. No system software or PATH settings are changed by this project.

## Setup (PowerShell)

Run commands in `D:\ADBMS\ADBMS`.

1. Copy `.env.example` to `.env`. Create database `ssrms`, configure a migration account and a separate restricted runtime account, and set a random JWT secret of at least 32 bytes. Keep `.env` private.
2. Install packages and generate Prisma Client:

   ```powershell
   npm install
   npm run prisma:generate
   ```

3. Configure `MIGRATION_DATABASE_URL` with the schema-owning migration account and `DATABASE_URL` with the non-superuser runtime account. Prisma uses `directUrl` for migrations and `url` for application connections. The seed script explicitly uses the migration URL so it can add demo users without granting user-write permission to the web account.
4. Apply the schema and create fictional demo data:

   ```powershell
   npm run db:migrate -- --name initial
   npm run db:seed
   ```

5. Apply `database/roles.sql` as a PostgreSQL administrator, then `database/permissions.sql` after migrations. Set login passwords interactively in `psql` using `\password ssrms_app` and `\password ssrms_migrator`; do not put real passwords in SQL scripts or Git.
6. Start the server with the restricted runtime `DATABASE_URL`:

   ```powershell
   npm run dev
   ```

Open `http://localhost:3000`. Health check: `http://localhost:3000/api/health`.
The authenticated workspace has Overview and Students sections; administrators also have an Audit log section. Use the sidebar links (or the overview quick links) to navigate. Lecturer and viewer dashboard summaries/actions adjust to their roles, and the API remains the permission authority.

## Demo accounts

| Role | Email | Seed-only password |
|---|---|---|
| Administrator | `admin@ssrms.test` | `AdminDemo!2468` |
| Lecturer | `lecturer@ssrms.test` | `LecturerDemo!2468` |
| Viewer | `viewer@ssrms.test` | `ViewerDemo!2468` |

These are public demonstration credentials. Never reuse them in production or expose a demo deployment to the public internet.

## Permissions

| Operation | Administrator | Lecturer | Viewer |
|---|---:|---:|---:|
| List/search/view students | Yes | Yes | Yes |
| Add/delete students | Yes | No | No |
| Update all student fields | Yes | No | No |
| Update grade only | Yes | Yes | No |
| View audit log | Yes | No | No |

All restrictions are enforced by API middleware and handlers as well as being reflected in the interface. An authenticated but unauthorized API request returns 403; unauthenticated requests return 401.

## PostgreSQL security demonstration

`database/roles.sql` creates NOLOGIN group roles (least privilege), plus distinct runtime and migration login roles. Configure passwords interactively. `database/permissions.sql` grants narrow table/column rights and prevents application/demo roles from updating or deleting audit rows. Run the scripts in order after the Prisma migration, using an administrator only for setup.

`database/security_tests.sql` contains successful and denied operations. In `psql`, execute one test statement at a time; stop after an expected permission error, then use `RESET ROLE`. For realistic role login testing, create distinct login users and grant membership in exactly one demo role. Never grant superuser to the app account.

Important caveat: this prototype uses a single limited `ssrms_app` database connection for web requests, so PostgreSQL sees the app account, not the current browser user. The SQL test roles are direct-database demonstrations; they are not automatically assumed based on the application role.

## SQL injection prevention

Normal reads/writes use Prisma Client, whose query methods bind values rather than treating them as SQL syntax. Search text is passed as a filter value. No endpoint constructs SQL by concatenating input. The health query uses Prisma's safe tagged-template `$queryRaw`. To explain the unsafe pattern in class, show a string concatenation example on slides only; do not execute it against a real database.

## API

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/students?search=...`
- `GET /api/students/:id`
- `POST /api/students` (administrator)
- `PUT /api/students/:id` (administrator, or lecturer grade-only)
- `DELETE /api/students/:id` (administrator)
- `GET /api/audit-logs` (administrator)

Login JSON: `{"email":"admin@ssrms.test","password":"AdminDemo!2468"}`. Use a cookie jar in Postman because the JWT is HttpOnly.

## Testing

Run JavaScript syntax checks using `npm run check`. Database-backed verification requires PostgreSQL, credentials, migrations, and seed data.

| Test | Expected result | Status |
|---|---|---|
| Valid demo login | 200 and HttpOnly cookie | Pending |
| Invalid password | 401 and no token | Pending |
| Request students without cookie | 401 | Passed (HTTP smoke test) |
| Viewer GET students | 200 | Pending |
| Viewer POST student | 403 | Pending |
| Lecturer update grade | 200 | Pending |
| Lecturer update profile/delete student | 403 | Pending |
| Administrator create/update/delete | 201/200/204 | Pending |
| Duplicate student number/email | 409 | Pending |
| Search string containing SQL-like text | Treated as data; no SQL execution | Pending |
| PostgreSQL viewer/lecturer denied statements | Permission denied as specified | Pending |
| Student mutation creates audit row | Event appears for administrator | Pending |

## Database schema overview

- `User`: identity, unique email, bcrypt hash, enum role, timestamps.
- `Student`: fictional student records, unique student number and email, optional decimal grade.
- `AuditLog`: event with optional user FK (set null if a user is removed), action, target, JSON details and timestamp.

Prisma Migrate owns schema changes. Do not manually alter application tables without reflecting changes in the Prisma schema and migrations.

## Presentation outline

| Slide | Talking point |
|---|---|
| 1. Database security | Define confidentiality, integrity, and availability as goals for protecting data. |
| 2. Problem and objectives | Explain why student records need protection and what the prototype will demonstrate. |
| 3. Threats | Contrast credential theft, excessive privilege, injection, and unauthorized access. |
| 4. Authentication vs authorization | Authentication verifies identity; authorization decides what an identity may do. |
| 5. RBAC and least privilege | Show how the three application roles receive only needed operations. |
| 6. SQL injection | Explain the unsafe string-concatenation idea conceptually, then show how safe Prisma filters bind input as data. |
| 7. PostgreSQL access control | Demonstrate GRANT/REVOKE and distinguish database principals from logged-in application users. |
| 8. Architecture | Trace one request from browser through Express and Prisma into PostgreSQL. |
| 9. Prisma data model | Describe User, Student, AuditLog, keys, uniqueness, and the audit relationship. |
| 10. Prototype walkthrough | Use fictional accounts to demonstrate permitted and rejected actions. |
| 11. Test results | Present only observed test results and explain any failures or pending DB tests. |
| 12. Limitations | Disclose the shared runtime database role, cookie/JWT trade-offs, and missing account-management UI. |
| 13. Conclusion | Recap layered controls and propose practical next security improvements. |
| 14. References | Cite official PostgreSQL, Prisma, and OWASP sources listed below. |

Explain each concept in your own words and demonstrate with the seeded accounts and PostgreSQL test roles. Do not invent test results.

## References

- PostgreSQL, *Database Roles*: https://www.postgresql.org/docs/current/user-manag.html
- PostgreSQL, *Privileges*: https://www.postgresql.org/docs/current/ddl-priv.html
- Prisma, *ORM overview*: https://www.prisma.io/docs/orm/overview/introduction
- Prisma, *Raw queries and SQL injection*: https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/raw-queries
- OWASP, *SQL Injection Prevention Cheat Sheet*: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
- OWASP, *Password Storage Cheat Sheet*: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
- OWASP, *Authentication Cheat Sheet*: https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

## Current limitations / follow-up

- PostgreSQL was not detected in the initial environment inspection; database setup, migration and functional/API tests remain pending.
- Runtime role has student CRUD rights because Express RBAC restricts requests for this one-connection demo.
- `npm audit` reports four high-severity advisories in Prisma 6's CLI/config dependency chain (`deepmerge-ts`, `effect`, `@prisma/config`, and `prisma`). npm identifies Prisma 7.10.1 as the available fix, which is a major-version migration; this project remains on Prisma 6 pending that separate compatibility change.
- Demo users are seeded by design; there is no user-management UI or password reset workflow.
- Login failure audit events have no user ID because the submitted email may not map to a valid account.
