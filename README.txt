JK TRADERS — CLOUD / NO-LOCAL-SERVER VERSION

This version is designed for the final setup:
- Static customer website
- Supabase cloud database
- Supabase email/password authentication for the private catalogue manager
- Customers always read the live product catalogue
- Admin changes are immediately visible on the store
- No Node.js server is required on your Mac

SETUP
1. Create a Supabase project.
2. In Supabase SQL Editor, run supabase/schema.sql.
3. Run supabase/seed.sql.
4. Create an admin user in Supabase Authentication -> Users.
5. Copy that user's UUID and run:
   insert into public.admins(user_id) values ('YOUR_AUTH_USER_UUID');
6. In Project Settings -> API, copy the Project URL and anon/public key into supabase-config.js.
7. Upload this folder to a static host such as Vercel/Netlify/GitHub Pages.
8. Open /admin on the deployed site.

SECURITY
- The browser only receives the Supabase anon/public key.
- RLS policies prevent non-admin users from modifying products.
- Never put the Supabase service_role key in this folder or in browser code.
- Use a strong admin password and enable email confirmation / MFA if desired.

LOCAL PREVIEW
Because this version uses Supabase, you can also preview it with any simple static server. Do not open index.html directly with file:// if your browser blocks module/network requests.

The catalogue is seeded from the existing JK Traders catalogue data in the previous build.
