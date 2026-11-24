-- Apply after Prisma migrations, as the schema owner or a database administrator.
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO ssrms_admin, ssrms_lecturer, ssrms_viewer, ssrms_app;

REVOKE ALL ON TABLE public."User", public."Student", public."AuditLog" FROM PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Student" TO ssrms_admin;
GRANT SELECT, UPDATE ("grade", "updatedAt") ON TABLE public."Student" TO ssrms_lecturer;
GRANT SELECT ON TABLE public."Student" TO ssrms_viewer;
GRANT SELECT, INSERT ON TABLE public."AuditLog" TO ssrms_admin, ssrms_lecturer, ssrms_viewer;
GRANT SELECT ON TABLE public."User" TO ssrms_admin;

-- The runtime login is non-superuser and has only operations required by this app.
-- It is intentionally not a member of the demo roles. App-level RBAC is enforced in Express.
GRANT SELECT ON TABLE public."User" TO ssrms_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."Student" TO ssrms_app;
GRANT SELECT, INSERT ON TABLE public."AuditLog" TO ssrms_app;

REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public."AuditLog"
FROM PUBLIC, ssrms_admin, ssrms_lecturer, ssrms_viewer, ssrms_app;
