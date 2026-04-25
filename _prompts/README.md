# Reka Engineering OS — Implementation Prompts

Semua file ini adalah prompt siap-paste ke **Cursor** (mode Agent).
Kerjakan **secara berurutan** karena beberapa stage saling bergantung.

---

## Urutan Pengerjaan — Full Roadmap

| # | File | Scope | Level | Estimasi | Status |
|---|---|---|---|---|---|
| 1 | `stage-1-permissions-fix.md` | Fix 3 predicate salah di `permissions.ts` | Small | ~10 mnt | ✅ Done |
| 2 | `stage-2-approval-notification.md` | Apply migration SQL + verifikasi notif end-to-end | Small | ~20 mnt | ✅ Done |
| 3 | `stage-3-google-drive.md` | Setup koneksi Google Drive + perbaiki UI status | Medium | ~20 mnt | ✅ Done |
| 4 | `stage-4-manajer-team-visibility.md` | Tambah visibility tim terbatas untuk Manajer | Medium | ~30 mnt | ✅ Done |
| 5 | `stage-5-drive-structure-multidiscipline.md` | Drive folder structure untuk multi-discipline | Medium | ~30 mnt | ✅ Done |
| 5b | `stage-5b-source-type-fix.md` | Fix source type bug | Small | ~10 mnt | ✅ Done |
| 6a | `stage-6a-email-setup.md` | Install Resend + buat client + 2 template | Small | ~15 mnt | ✅ Done |
| 6b | `stage-6b-invite-email.md` | Wire email ke `createInvite` action | Small | ~20 mnt | ✅ Done |
| 6c | `stage-6c-notification-webhook.md` | Webhook endpoint + setup Supabase Database Webhook | Medium | ~25 mnt | ✅ Done |
| 7 | `stage-7-finance-reports-page.md` | Halaman `/finance/reports` + cash flow forecast | Small | ~30 mnt | ⬜ |
| 8 | `stage-8-finance-per-project-margin.md` | Tabel margin per project di `/finance/reports` | Medium | ~30 mnt | ⬜ |
| 9 | `stage-9-notif-deliverable-event.md` | DB trigger notif untuk status deliverable | Small | ~15 mnt | ⬜ |
| 10 | `stage-10-notif-task-deadline-cron.md` | pg_cron reminder H-1 task deadline | Small-Medium | ~20 mnt | ⬜ |
| 11 | `stage-11-time-tracking.md` | Modul work logs + utilization report | Large | ~90 mnt | ⬜ |
| 12 | `stage-12-expense-tracking.md` | Modul expense per project + integrasi ke margin | Large | ~90 mnt | ⬜ |

---

## Dependency Map

```
6a → 6b → 6c          (email harus urut)
7  → 8                (reports page dulu, baru tambah tabel margin)
11 → update stage-8   (setelah time tracking, tambah utilization ke /finance/reports)
12 → update stage-8   (setelah expense, update getProjectMargins() — instruksi ada di stage-12 Step 6)
9, 10 → independent   (bisa dikerjakan kapan saja)
```

---

## Cara Pakai

1. Buka file stage yang mau dikerjakan
2. Copy **semua** isinya
3. Paste ke **Cursor** → mode **Agent**
4. Setelah selesai jalankan: `npx tsc --noEmit`
5. Test manual sesuai bagian **Verification** di tiap file
6. Tandai ✅ di tabel di atas

---

## Catatan Penting per Stage

### Stage 6a — Prerequisite external
- Buat akun Resend: https://resend.com
- Verify domain pengirim (atau pakai `onboarding@resend.dev` untuk testing)
- Siapkan: `RESEND_API_KEY` dan `RESEND_FROM`

### Stage 6c — Manual step di Supabase
- Setup Database Webhook di Supabase Dashboard (tidak bisa lewat kode)
- Tambah `SUPABASE_WEBHOOK_SECRET` ke `.env.local` dan Vercel env vars

### Stage 7 & 8 — Halaman Finance Reports
- Stage 7: buat halaman + P&L cards + cash flow forecast
- Stage 8: tambah tabel per-project margin ke halaman yang sama

### Stage 9 & 10 — SQL-only stages
- Kedua stage ini **hanya** buat file SQL + apply manual di Supabase
- Tidak ada perubahan TypeScript
- Bisa dikerjakan paralel dengan stage lain

### Stage 10 — pg_cron
- Aktifkan extension `pg_cron` di Supabase Dashboard → Extensions
- Cron job berjalan 08:00 WIB (01:00 UTC) setiap hari

### Stage 11 — Time Tracking (Large)
- Jika Cursor timeout, simpan progress dan lanjut di session baru
- Setelah selesai: update `/finance/reports` untuk tampilkan utilization dari `work_logs`

### Stage 12 — Expense Tracking (Large)
- Setelah selesai: **wajib** update `getProjectMargins()` di `lib/finance/reports-queries.ts`
  menggunakan instruksi di **Step 6** file ini
- Expense approved akan otomatis masuk ke kalkulasi project margin

---

## Gap Table — Status

| Gap | Stage | Level | Status |
|---|---|---|---|
| Finance: halaman `/finance/reports` | 7 | Small | ⬜ |
| Finance: cash flow forecast | 7 | Medium | ⬜ |
| Finance: per-project margin | 8 | Medium | ⬜ |
| Finance: team utilization | 11 (post) | Medium | ⬜ |
| Invite via email (auto-send) | 6b | Small | ✅ Done |
| Notif: external email | 6c | Medium | ✅ Done |
| Notif: deliverable event | 9 | Small | ⬜ |
| Notif: task deadline reminder | 10 | Small-Medium | ⬜ |
| Time tracking | 11 | Large | ⬜ |
| Expense tracking | 12 | Large | ⬜ |

**Readiness sekarang: ~85%** (email delivery done + deployed)
**Setelah semua stage selesai: ~95%**
