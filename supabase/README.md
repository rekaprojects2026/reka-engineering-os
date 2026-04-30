# Supabase Placeholder

This folder is reserved for:
- migrations
- SQL setup
- seed data
- RLS policy scripts

Do not let the AI invent hidden database structure outside this folder.

## Engineering Document library (`engdocs` schema)

Migrations **`0041`** … **`0044_engdocs_direktur_super_admin.sql`** add/update the shared schema for the **REKA Engineering Document** app (tables, RLS, link to `public.profiles`; OS **direktur** → library **`super_admin`**).

After `db push`, in Supabase Dashboard → **Settings → Data API → Exposed schemas**, add **`engdocs`** beside `public`.

Details for the Document repo: see **`REKA_Integration_Supabase.md`** in `reka-engineering-document`.
