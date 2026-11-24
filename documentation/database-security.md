# Database security design

## Security layers

1. **Authentication:** passwords are checked with bcrypt; stored values are hashes only. The API sets a short-lived JWT in an HttpOnly, SameSite=Strict cookie.
2. **Authorization:** Express checks the authenticated database user role for each operation. A lecturer's update handler accepts only a grade field; an admin can update student details. Viewers can only read.
3. **Database privileges:** PostgreSQL roles demonstrate table/column grants. The web service connects as a non-superuser runtime login. Because that is one shared connection, database permissions do not change per logged-in user. The role exercise is a separate direct-SQL demonstration.
4. **Injection defense:** Prisma query APIs bind values safely. Do not construct SQL strings with user-controlled content.
5. **Audit:** the app inserts events for login and student operations and denied role checks. Runtime and demo roles receive insert/select, not update/delete, on audit rows. Database owners/superusers can still alter data.

## Role matrix

| Role | Student table | Audit log | User table |
|---|---|---|---|
| ssrms_admin | SELECT/INSERT/UPDATE/DELETE | SELECT/INSERT | SELECT |
| ssrms_lecturer | SELECT; UPDATE grade and updatedAt | SELECT/INSERT | None |
| ssrms_viewer | SELECT | SELECT/INSERT | None |
| ssrms_app | SELECT/INSERT/UPDATE/DELETE | SELECT/INSERT | SELECT |

The runtime account's broad student table grants are required by the demo server as currently designed; Express is the per-user authorization boundary. For stronger defense-in-depth, split service connections/DB roles or use carefully designed PostgreSQL security functions rather than claiming the shared connection represents individual end users.

## Limitations

This is a classroom prototype, not a production-ready student information system. It omits TLS deployment, account provisioning/password reset, key rotation, comprehensive monitoring, pagination beyond the first 200 results, and administrator review workflows. JWT cookie deployment must use HTTPS. Demo credentials and fictional data are local demonstration values only.
