-- Run statements individually with SET ROLE to demonstrate database permissions.
-- Expected: viewer SELECT succeeds; INSERT/UPDATE/DELETE fail.
SET ROLE ssrms_viewer;
SELECT "studentNumber", "firstName", "lastName" FROM public."Student" LIMIT 5;
-- Expected error: permission denied for table Student.
INSERT INTO public."Student" ("id", "studentNumber", "firstName", "lastName", "programme", "email", "updatedAt")
VALUES (gen_random_uuid(), 'DENIED-VIEWER', 'Demo', 'Viewer', 'Demo', 'denied-viewer@example.test', now());
RESET ROLE;

-- Expected: lecturer may update grades but cannot change profile fields or delete.
SET ROLE ssrms_lecturer;
UPDATE public."Student" SET "grade" = 80, "updatedAt" = now() WHERE "studentNumber" = 'ZUT-DEMO-001';
-- Expected error: permission denied for column firstName / table Student.
UPDATE public."Student" SET "firstName" = 'Not Allowed' WHERE "studentNumber" = 'ZUT-DEMO-001';
-- Expected error: permission denied for table Student.
DELETE FROM public."Student" WHERE "studentNumber" = 'ZUT-DEMO-001';
RESET ROLE;

-- Expected: admin role can create/read/update/delete a disposable student record.
SET ROLE ssrms_admin;
INSERT INTO public."Student" ("id", "studentNumber", "firstName", "lastName", "programme", "email", "updatedAt")
VALUES (gen_random_uuid(), 'ADMIN-SECURITY-TEST', 'Demo', 'Admin', 'Security Test', 'admin-security-test@example.test', now());
SELECT "studentNumber" FROM public."Student" WHERE "studentNumber" = 'ADMIN-SECURITY-TEST';
UPDATE public."Student" SET "programme" = 'Updated Security Test', "updatedAt" = now()
WHERE "studentNumber" = 'ADMIN-SECURITY-TEST';
DELETE FROM public."Student" WHERE "studentNumber" = 'ADMIN-SECURITY-TEST';
RESET ROLE;
