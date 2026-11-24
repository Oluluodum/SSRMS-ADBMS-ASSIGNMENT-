# Testing report

No database-dependent tests have been executed yet because PostgreSQL was not detected in the initial environment inspection. Run the tests below after PostgreSQL setup, then replace Pending with observed results and evidence.

| Test | Role | Expected result | Actual result | Status |
|---|---|---|---|---|
| Valid login | All | Cookie issued; user profile returned | Not run | Pending |
| Invalid login | All | HTTP 401; no cookie | Not run | Pending |
| Serve login page | Browser | HTTP 200 with SSRMS title | HTTP 200 | Passed |
| Unauthenticated profile request | None | HTTP 401 | HTTP 401 | Passed |
| List and search students | Viewer | HTTP 200; matching fictional records | Not run (PostgreSQL unavailable) | Pending |
| Create student | Administrator | HTTP 201; audit event recorded | Not run | Pending |
| Create student | Lecturer / Viewer | HTTP 403 | Not run | Pending |
| Update student grade | Lecturer | HTTP 200; grade changes | Not run | Pending |
| Update non-grade fields | Lecturer | HTTP 400 for payload / 403 for forbidden operation | Not run | Pending |
| Delete student | Lecturer / Viewer | HTTP 403 | Not run | Pending |
| Delete student | Administrator | HTTP 204; audit event recorded | Not run | Pending |
| PostgreSQL SELECT as viewer | ssrms_viewer | Success | Not run | Pending |
| PostgreSQL INSERT as viewer | ssrms_viewer | Permission denied | Not run | Pending |
| PostgreSQL update grade | ssrms_lecturer | Success | Not run | Pending |
| PostgreSQL update profile/delete | ssrms_lecturer | Permission denied | Not run | Pending |
| Injection-like search input | Any | Treated as data, not SQL syntax | Not run | Pending |

Use the seeded fictional data only. The API search uses Prisma Client filters; submit a search string that contains SQL-looking punctuation and confirm it behaves as ordinary text and does not alter records.
