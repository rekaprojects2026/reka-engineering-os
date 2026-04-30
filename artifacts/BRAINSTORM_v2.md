# Reka Engineering OS — Brainstorming Document
_Versi 2 | 21 April 2026_

---

## Konteks: Ini Aplikasi Apa?

Reka Engineering OS adalah internal operating system buat sebuah firma engineering (konsultan teknik / desain). Aplikasi ini dipakai sehari-hari oleh tim internal untuk mengelola seluruh operasi bisnis — dari awal dapet lead klien sampai proyek selesai dan tim dibayar.

Penggunanya ada tiga lapisan:
- **Admin / Owner**: lihat semua, setting semua, approve semua
- **Coordinator / PM**: kelola proyek, assign tugas, track pembayaran
- **Member / Freelancer**: lihat tugas mereka sendiri, input deliverable, lihat pembayaran mereka

Bisnis ini kerja dengan campuran **tim internal + freelancer + subkontraktor**. Proyek bisa datang dari berbagai source: langsung dari klien (direct), dari platform freelance (Fiverr, Upwork), atau dari referral.

---

## State Sekarang: Apa yang Sudah Ada

Sebelum masuk ke apa yang perlu diubah, penting untuk paham dulu apa yang sudah jalan, supaya brainstorming-nya bisa lebih fokus ke gap, bukan reinvent yang sudah ada.

### Yang sudah jalan dengan baik:

**Manajemen Tim**: Sistem profil tim sudah cukup lengkap — nama, role, tipe worker (internal/freelancer/subkontraktor), rate kerja, nomor rekening, skill tags, status ketersediaan. Sistem invite untuk onboarding member baru juga sudah ada.

**Manajemen Proyek**: Proyek sudah bisa dibuat, diassign ke project lead, dikasih deadline, diprioritasi. Ada tracking status dan progress. Ada relasi ke klien.

**Task Management**: Task sudah bisa dibuat per proyek, diassign ke orang, dikasih deadline dan prioritas. Sudah ada konsep parent-child task (subtask) di database, tapi belum keliatan di UI.

**Deliverable & File Tracking**: Ada sistem terpisah untuk tracking deliverable (output proyek seperti gambar, laporan) dan file (file aktualnya). Sudah ada field untuk Google Drive tapi integrasinya belum aktif.

**Kompensasi Tim**: Sudah ada sistem untuk mencatat berapa yang harus dibayar ke masing-masing orang berdasarkan kerjaan mereka (per jam, per hari, per task, dll). Sudah ada sistem payment records untuk merangkum total bayar per periode.

**Intake / Leads**: Sudah ada sistem untuk mencatat inquiry masuk dari klien, beserta proses convert-nya jadi proyek aktif.

**Settings**: Sudah ada tabel di database untuk menyimpan pilihan dropdown secara dinamis. Tapi baru separuh yang sudah dimigrasikan — sisanya masih hardcoded di kode.

### Yang belum ada / masih kurang:

- Sistem multi-currency (semua masih IDR hardcoded)
- Tracking pembayaran **masuk** dari klien (invoice, incoming payment)
- Akun/channel pembayaran (Wise, PayPal, rekening bank)
- Laporan keuangan (PnL, revenue, biaya)
- Kanban view
- Dashboard performa per orang
- Foto profil
- Integrasi Google Drive yang aktif
- Tab outreach (perusahaan yang mau dihubungi)
- PDF invoice dan payslip

---

## Yang Perlu Dibangun: Penjelasan Per Topik

---

### 1. Sistem Multi-Currency (USD/IDR)

**Masalahnya sekarang**: Semua angka di aplikasi diasumsikan IDR. Padahal bisnis ini kerja dengan klien internasional yang bayar dalam USD, dan platform seperti Fiverr/Upwork juga transaksinya dalam USD. Jadi ada mismatch antara realita bisnis dan apa yang tertulis di sistem.

**Yang diinginkan**: Setiap input uang bisa pilih mata uang (USD atau IDR). Setiap tampilan uang menampilkan dua-duanya sekaligus — angka aslinya plus konversinya ke mata uang lain. Contoh: "USD 1,000 (~Rp 16.500.000)".

**Pertimbangan desain yang perlu didiskusikan**:

Yang pertama soal **bagaimana menyimpan data historis**. Kalau kita selalu convert ke IDR dan hanya simpan IDR-nya, maka laporan keuangan bulan lalu akan berubah nilainya kalau kurs berubah — ini salah secara akuntansi. Solusinya adalah menyimpan mata uang asli + kurs saat transaksi terjadi, sehingga nilai historis tidak pernah berubah. Tapi ini berarti setiap transaksi perlu "snapshot" kurs-nya.

Yang kedua soal **dari mana kurs datang**. Ada dua opsi: (a) admin input manual kurs USD/IDR secara berkala di Settings, atau (b) sistem otomatis ambil dari API kurs real-time. Opsi manual lebih simpel dan cukup untuk bisnis skala ini, karena kurs tidak perlu akurat ke detik. Opsi API lebih akurat tapi butuh maintenance ekstra dan dependency ke servis luar.

Yang ketiga soal **di mana semua ini diterapkan**. Ini bukan hanya soal satu input field — ini harus konsisten di seluruh aplikasi: input budget di leads, input rate di profil tim, input invoice, tampilan di dashboard, laporan PnL, semua harus bisa dual-currency. Jadi ini adalah perubahan **foundation** yang harus selesai sebelum fitur keuangan lainnya dibangun.

---

### 2. Akun & Channel Pembayaran

**Masalahnya sekarang**: Tidak ada konsep "uang masuk ke rekening mana" di sistem. Semua transaksi mengambang tanpa ada tracking ke akun spesifik.

**Yang diinginkan**: Tiga channel utama — Wise, PayPal, dan rekening bank Haris. Per proyek harus keliatan uang kliennya masuk ke channel mana. Dan harus ada tampilan saldo per akun.

**Pertimbangan desain yang perlu didiskusikan**:

Soal **Wise yang multi-currency**: Wise bisa pegang beberapa mata uang sekaligus. Apakah Wise USD dan Wise IDR kita anggap satu akun atau dua akun terpisah? Kalau satu akun, tracking saldo per mata uangnya lebih rumit. Kalau dua akun terpisah (Wise-USD dan Wise-IDR), lebih simpel dan mudah dibaca. Saran: pisahkan per currency.

Soal **saldo**: Ada dua cara hitung saldo — (a) hitung otomatis dari semua transaksi masuk dikurangi keluar yang tercatat di sistem, atau (b) admin input saldo manual dan sistem hanya tracking perubahan. Opsi (a) lebih akurat kalau semua transaksi masuk ke sistem, tapi butuh semua pembayaran benar-benar diinput. Opsi (b) lebih fleksibel tapi bisa drift kalau ada transaksi yang lupa diinput.

Soal **siapa yang punya akun**: Rekening Haris itu atas nama Haris secara personal atau atas nama perusahaan? Ini penting untuk laporan — kalau personal, ada risiko mix antara keuangan personal dan bisnis.

---

### 3. Tracking Pembayaran dari Klien (Invoice & Incoming Payment)

**Masalahnya sekarang**: Tidak ada sama sekali. Sistem hanya track bayar ke tim, tidak track terima dari klien. Jadi tidak ada cara untuk tahu total revenue, siapa yang belum bayar, atau proyek mana yang sudah lunas.

**Yang diinginkan**: Bisa buat invoice untuk klien, track berapa yang sudah masuk, dan tahu posisi piutang setiap saat.

**Pertimbangan desain yang perlu didiskusikan**:

Soal **struktur invoice**: Satu proyek bisa punya lebih dari satu invoice — misalnya ada DP, progress payment, dan pelunasan. Jadi invoice harus bisa dibikin multiple per proyek. Dan tiap invoice bisa punya beberapa line item (daftar item tagihan).

Soal **potongan platform (Fiverr/Upwork)**: Ini harusnya dicatat di level invoice, bukan di level proyek. Kenapa? Karena Upwork punya sistem tiered fee yang bisa beda per milestone (20% untuk transaksi awal, turun jadi 10% setelah threshold tertentu). Kalau disimpan di proyek, kita kehilangan detail per transaksi.

Soal **biaya payment gateway**: Di atas potongan platform, masih ada lagi biaya transfer dari PayPal atau Wise. Ini juga perlu dicatat terpisah. Jadi satu tagihan punya struktur: Gross Amount → dikurangi Platform Fee → dikurangi Gateway Fee → Net yang diterima.

Soal **relasi ke payment account**: Setiap invoice perlu tahu "uang ini diharapkan masuk ke rekening mana". Ini penting untuk rekonsiliasi.

Soal **status invoice**: Minimal perlu: Draft (belum dikirim), Sent (sudah dikirim ke klien), Partial (baru sebagian dibayar), Paid (lunas), Overdue (jatuh tempo belum bayar), Void (dibatalkan).

---

### 4. Auto-Generate PDF (Invoice & Payslip)

**Masalahnya sekarang**: Tidak ada. Admin kemungkinan bikin invoice manual di Word/Google Docs atau pakai template terpisah.

**Yang diinginkan**: Dari dalam aplikasi, bisa generate PDF invoice untuk klien dan PDF payslip untuk anggota tim, dengan satu klik.

**Pertimbangan desain yang perlu didiskusikan**:

Soal **template**: Invoice klien perlu branding Reka (logo, nama perusahaan, alamat, NPWP kalau perlu), detail klien, tabel line item, breakdown fee (gross/platform/gateway/net), instruksi pembayaran (nomor rekening per channel), deadline pembayaran.

Payslip tim perlu: nama member, periode, daftar semua kompensasi (per task/deliverable/proyek, dengan rate dan jumlah), total yang harus dibayar, total yang sudah dibayar, sisa tagihan.

Soal **kapan di-generate**: Invoice bisa di-generate dari halaman detail invoice. Payslip bisa di-generate dari payment record. Hasilnya bisa download langsung atau dikirim via email (kalau mau lebih advanced).

---

### 5. Flow Operasi: Leads → Projects → Tasks → Files

**Masalahnya sekarang**: Secara teknis, datanya sudah terhubung (leads punya pointer ke proyek, proyek punya pointer balik ke lead). Tapi pengalaman UI-nya masih terasa seperti dua entitas terpisah yang "dilink", bukan sebuah pipeline yang mengalir.

**Yang diinginkan**: Pengalaman satu pipeline linier. Kalau lead statusnya berubah jadi "Closed/Won", tombol konversi ke proyek muncul langsung inline — tidak perlu pindah ke halaman lain. Proyek yang sudah ada tasks-nya, task-tasknya bisa di-breakdown jadi deliverable + file, semua dalam satu tempat.

**Pertimbangan desain yang perlu didiskusikan**:

Soal **konversi lead ke proyek**: Ada dua pendekatan — (a) modal/popup inline yang muncul dari halaman leads, pre-filled dengan data lead, tinggal isi kolom yang kurang (seperti project lead dan tanggal mulai), atau (b) fully automated, begitu status lead diganti "Closed" langsung auto-create proyek tanpa intervensi. Opsi (a) lebih aman karena masih bisa review sebelum proyek dibuat. Opsi (b) lebih cepat tapi berisiko bikin proyek dari lead yang belum siap.

Soal **proyek tanpa lead**: Tetap harus bisa bikin proyek langsung tanpa harus lewat leads dulu — misalnya kalau ada proyek datang yang langsung closed/deal.

Soal **void dan problem**: Perlu dibedakan antara "status void" (proyek/task dibatalkan total) dengan "flag problem" (proyek masih jalan tapi ada masalah). Keduanya berguna tapi punya implikasi berbeda — yang void tidak perlu muncul di dashboard aktif, yang bermasalah harus muncul dengan penanda merah supaya diperhatikan.

Soal **mundur deadline**: Kalau deadline sering dimundurkan, itu sendiri adalah informasi penting. Perlu ada histori perubahan deadline per proyek dan per task — siapa yang mundurkan, kapan, dan alasannya. Tanpa ini, tidak ada akuntabilitas.

---

### 6. Tab Leads (Rename dari Intakes)

**Masalahnya sekarang**: Tab namanya "Intakes", posisinya di bawah Clients di navigasi. Tidak ada field untuk kontak klien (nomor WA, email), tidak ada field kompleksitas yang terukur, dan budget hanya bisa IDR.

**Yang diinginkan**: Rename jadi "Leads", posisikan di atas Clients. Tambah field kontak (channel komunikasi + nilai kontak). Budget bisa USD atau IDR. Tambah indikator kompleksitas yang kuantitatif.

**Pertimbangan desain yang perlu didiskusikan**:

Soal **indikator kompleksitas**: Saat ini tidak ada field ini. Yang diinginkan adalah sesuatu yang kuantitatif, bukan hanya "Low/Medium/High". Opsi yang bisa didiskusikan: (a) skor 1-10 dengan label otomatis (1-3 = Low, 4-6 = Medium, 7-8 = High, 9-10 = Very High), (b) beberapa dimensi terpisah (technical complexity, scope size, timeline pressure) yang dijumlah jadi skor akhir. Opsi (a) lebih simpel, opsi (b) lebih informatif tapi lebih kompleks diisi.

Soal **channel kontak**: Perlu ada dua hal — (a) salurannya (WA, Email, Instagram, LinkedIn, dll) dan (b) nilai kontaknya (nomor HP, alamat email, username). Keduanya sebaiknya disimpan terpisah supaya bisa difilter, misalnya "tampilkan semua leads yang masuk via WA".

---

### 7. Tab Proyek — Penyempurnaan

**Masalahnya sekarang**: Progress proyek diisi manual. Subtask ada di database tapi tidak keliatan di UI. Deliverable, task, dan file masih tiga tab terpisah. Status hanya bisa diubah dari halaman detail proyek. Tidak ada kanban view.

**Yang diinginkan**: Progress otomatis dari tasks. Tampilan subtask dengan indentasi. Merge ketiga tab jadi satu tampilan kerja terpadu. Edit status inline dari tabel. Kanban view tersedia.

**Pertimbangan desain yang perlu didiskusikan**:

Soal **rumus progress otomatis**: Ada dua pendekatan — (a) berbasis jumlah task (jumlah task done dibagi total task), atau (b) berbasis jam estimasi (jam task done dibagi total jam yang diestimasikan). Opsi (a) lebih simpel dan tidak bergantung pada kelengkapan data estimasi jam, yang sering tidak diisi. Opsi (b) lebih akurat tapi butuh semua task diisi estimated_hours-nya.

Soal **merge deliverable + file + task**: Ini perubahan UX yang cukup signifikan. Saat ini deliverable adalah entitas terpisah dengan sistem approval dan revisi sendiri. Kalau digabung ke "Work" tab di dalam proyek, perlu dipikir bagaimana hierarchy-nya — apakah task punya deliverable, atau deliverable punya file, atau keduanya bisa exist secara independen? Yang paling masuk akal: task adalah unit kerja, deliverable adalah output terukurnya, file adalah file aktualnya. Tapi di UI, tampilkan semua dalam satu tree tanpa perlu navigasi ke tiga tab berbeda.

Soal **"file yang sudah di-acc"**: Ini berarti perlu ada flag "Approved/Final" pada file. File yang sudah diapprove klien perlu dibedakan secara visual dari file yang masih WIP. Ini penting untuk tracking revision history.

Soal **auto-generate Google Drive folder**: Perlu disepakati dulu naming convention-nya. Yang disarankan: `[TAHUN]-[KODE KLIEN]-[KODE PROYEK] [Nama Proyek Singkat]`. Dan perlu akses ke Google Drive API — apakah sudah ada service account? Ini bukan perubahan UI, tapi butuh credential dan setup di luar kode.

---

### 8. Tab Tasks

**Masalahnya sekarang**: Task list ada tapi filternya terbatas. Tidak ada filter per orang. Assign task ke orang sudah bisa (ada di database) tapi mungkin UI-nya kurang menonjol.

**Yang diinginkan**: Bisa filter tasks per orang dan per proyek. Assign orang ke task harus jelas di UI.

**Pertimbangan desain yang perlu didiskusikan**:

Soal **view per orang**: Ini berguna banget untuk standup atau 1-on-1 — "kamu lagi ngerjain apa aja sekarang". Bisa diimplementasikan sebagai filter dropdown "Tampilkan tasks milik: [nama orang]". Atau bahkan ada dedicated halaman per-orang yang tampilkan semua task aktif mereka.

Soal **kanban per task**: Di kanban view tasks, kolom-kolomnya adalah status (Backlog, In Progress, Review, Done, dsb). Bisa difilter per proyek atau per orang. Yang menarik untuk didiskusikan: apakah subtask muncul di kanban, atau hanya top-level task?

---

### 9. Tab People

**Masalahnya sekarang**: Halaman tim ada (tabel list orang) tapi tidak ada gambaran performa atau finansial per orang. Tidak ada foto. Ada dua tab search yang overlapping.

**Yang diinginkan**: Dashboard performa per orang (berapa proyek dikerjakan, % on-time, total dibayar, pending). Foto profil. Satu tab search saja.

**Pertimbangan desain yang perlu didiskusikan**:

Soal **metrik performa**: Metrik yang diminta — jumlah proyek, % on-time, total dibayar, pending bayar — semuanya bisa dihitung dari data yang sudah ada. Yang perlu dipikir adalah: (a) bagaimana definisi "on-time" — task selesai sebelum atau sama dengan deadline originalnya, atau deadline terakhir setelah revisi? Kalau deadline sering dimundurkan, on-time berdasarkan deadline original lebih jujur, tapi mungkin terasa tidak adil kalau deadline mundur karena faktor eksternal. (b) Apakah metrik ini di-refresh real-time atau di-cache? Kalau banyak orang dan proyek, query bisa berat.

Soal **tampilan**: Apakah orang-orang ditampilkan sebagai cards (dengan foto prominent) atau sebagai tabel? Cards lebih visual dan ramah untuk HR/management, tabel lebih dense untuk operasional. Bisa kasih toggle antara keduanya.

Soal **foto profil**: Foto disimpan di Supabase Storage (cloud storage bawaan Supabase). Upload bisa dari halaman "My Profile" oleh member sendiri, atau dari halaman edit anggota oleh admin.

---

### 10. Dashboard Finansial

**Masalahnya sekarang**: Dashboard sudah ada tapi hanya KPI operasional. Tidak ada financial overview, tidak ada P&L, tidak ada breakdown revenue vs. biaya.

**Yang diinginkan**: Tambah widget-widget finansial — revenue dari klien, biaya ke tim, P&L, outstanding invoice, pending pembayaran tim. Semua dalam dual-currency (USD + IDR).

**Pertimbangan desain yang perlu didiskusikan**:

Soal **P&L**: Profit & Loss = Revenue Bersih (setelah platform fee dan gateway fee) dikurangi Total Biaya Tim (kompensasi yang sudah confirmed/paid). Tapi ada nuance — apakah P&L dihitung per bulan, per kuartal, atau per proyek? Kemungkinan butuh keduanya: time-based (bulan ini kita untung berapa) dan project-based (proyek X profitable berapa persen).

Soal **budget vs actual spending**: User menyebut ini sebagai wishlist yang bisa belakangan. Tapi kalau mau didesain sekarang, butuh field "budget_amount" di proyek (anggaran yang disetujui), lalu dibandingkan dengan actual spending (total kompensasi yang paid untuk proyek itu). Ini valuable banget untuk project profitability tracking.

Soal **"incoming dari klien" vs "keluar ke tim"**: Ini dua arus uang yang berbeda. Incoming harus track dari `client_invoices`. Outgoing track dari `compensation_records` dan `payment_records`. Untuk balance yang benar, keduanya harus ada dulu sebelum dashboard P&L bisa akurat.

---

### 11. Kanban View (Lintas Modul)

**Masalahnya sekarang**: Tidak ada kanban view di manapun. Semua tampilan berbentuk tabel/list.

**Yang diinginkan**: Kanban view di Projects dan di Tasks. Drag card antar kolom untuk ubah status.

**Pertimbangan desain yang perlu didiskusikan**:

Soal **kolom kanban**: Kolom = status. Untuk proyek: New, In Progress, On Hold, Review, Completed. Untuk task: Backlog, In Progress, Review, Done. Yang menarik: apakah "On Hold" dan "Cancelled" ditampilkan di kanban? Terlalu banyak kolom bisa bikin kanban tidak efektif. Bisa ada opsi "hide empty columns".

Soal **card content**: Project card perlu tampilkan nama proyek, klien, deadline, assignee, dan progress bar. Task card perlu tampilkan judul task, nama proyek, assignee, dan deadline. Desain card harus compact karena banyak item yang mungkin ada di satu kolom.

Soal **drag behavior**: Kalau drag card dari kolom In Progress ke Done, statusnya otomatis berubah. Tapi bagaimana kalau statusnya punya constraint tertentu (misalnya task harus punya deliverable sebelum bisa Done)? Perlu dipikir apakah ada validasi di sini, atau drag bebas tanpa constraint.

---

### 12. Tab Outreach (Baru)

**Masalahnya sekarang**: Tidak ada tempat untuk track perusahaan/klien potensial yang mau dihubungi.

**Yang diinginkan**: Tab baru untuk mencatat company yang mau direachout, tracking status komunikasinya, dan bila berhasil bisa dikonvert jadi lead.

**Pertimbangan desain yang perlu didiskusikan**:

Ini sebenernya adalah **pre-lead pipeline** — sebelum ada lead formal, ada proses proaktif cari klien baru. Outreach → Contacted → Replied → Bisa jadi Lead → Bisa jadi Proyek.

Soal **status outreach**: Minimal perlu: To Contact, Contacted (sudah hubungi, belum balas), Replied (sudah balas), In Discussion (sedang diskusi), Converted to Lead, Declined (tidak tertarik). Mungkin perlu juga "Re-contact Later" dengan reminder date.

Soal **channel**: Penting untuk dilacak via channel apa — Upwork, LinkedIn, Email, Direct, dsb. Ini berguna untuk evaluasi: channel mana yang paling efektif menghasilkan leads.

---

### 13. Revenue Per Klien

**Masalahnya sekarang**: Di halaman clients tidak ada informasi finansial sama sekali. Tidak ada cara untuk tahu klien mana yang paling valuable.

**Yang diinginkan**: Di tabel clients, tampilkan total revenue yang sudah di-generate per klien.

**Pertimbangan desain yang perlu didiskusikan**:

Soal **definisi revenue**: Apakah yang ditampilkan adalah gross amount (sebelum potongan platform/gateway), atau net amount (setelah semua potongan)? Untuk perbandingan antar klien, keduanya punya nilai berbeda — gross menunjukkan nilai kontrak, net menunjukkan yang benar-benar masuk rekening.

Soal **timeline**: Total sejak awal, atau per tahun/bulan ini? Untuk halaman clients, total sejak awal paling informatif. Untuk dashboard, bisa difilter per periode.

---

## Ketergantungan Antar Fitur (Feature Dependencies)

Beberapa fitur tidak bisa dibangun sebelum fitur lain selesai. Ini penting untuk menentukan urutan pembangunan:

**Currency System harus selesai duluan** sebelum: invoice, incoming payment, dashboard finansial, payslip, revenue per klien. Semua fitur yang ada angkanya bergantung pada sistem multi-currency yang bener.

**Payment Accounts harus selesai sebelum** Invoice bisa dicatat ke "rekening mana". Dan sebelum saldo per akun bisa dihitung.

**Invoice & Incoming Payment harus selesai sebelum** dashboard P&L bisa akurat, revenue per klien bisa ditampilkan, dan payslip bisa cross-reference dengan apa yang sudah diterima dari klien.

**Deliverable/File merge di UI** tidak bergantung pada hal lain — bisa dilakukan relatif independen.

**Kanban** juga relatif independen dari fitur lain, hanya butuh library tambahan.

**Google Drive integration** paling independen, bisa dikerjakan kapan saja asalkan credential sudah ada.

---

## Pertanyaan Terbuka untuk Didiskusikan

Berikut pertanyaan-pertanyaan yang belum ada jawaban definitifnya dan perlu keputusan pemilik produk:

1. **FX rate**: Manual diisi admin, atau otomatis dari API? Manual lebih simpel, API lebih akurat.

2. **Platform fee di mana**: Per invoice (direkomendasikan) atau per proyek? Per invoice lebih akurat untuk Upwork yang punya tier fee.

3. **Konversi lead ke proyek**: Modal inline (lebih aman, masih bisa review) atau auto-convert begitu status diganti (lebih cepat tapi berisiko)?

4. **Deliverable entity**: Tetap ada sebagai konsep tapi di-merge di UI (recommended), atau dihapus total dan semua jadi "file"?

5. **Rumus progress proyek**: Count-based (jumlah task done / total task) atau hour-based (jam done / total estimasi jam)?

6. **Void vs Problem**: Apakah "void" dan "bermasalah" jadi dua hal terpisah (void = dibatalkan, problem = masih jalan tapi ada isu), atau cukup satu status saja?

7. **Audit trail deadline**: Perlu histori lengkap (siapa, kapan, alasan apa) atau cukup update field deadline tanpa histori?

8. **Saldo akun pembayaran**: Dihitung otomatis dari transaksi di sistem, atau admin input manual?

9. **Kompleksitas lead**: Skor tunggal 1-10, atau multi-dimensi (beberapa aspek dinilai terpisah)?

10. **On-time metric**: Berdasarkan deadline original atau deadline terakhir (setelah revisi)?

11. **Kanban constraints**: Bebas drag ke status apapun, atau ada validasi tertentu sebelum status bisa berubah?

12. **Google Drive**: Sudah ada service account-nya? Atau perlu setup dari awal?

13. **Wise treatment**: "Wise USD" dan "Wise IDR" sebagai dua akun terpisah, atau satu akun Wise dengan multi-currency?

14. **Budget vs Actual**: Mau diimplementasikan sekarang atau nanti? Kalau nanti, field budget di proyek perlu disiapkan sekarang supaya data tidak hilang.

15. **P&L per proyek vs per periode**: Keduanya, atau pilih satu dulu?

---

## Estimasi Relatif Kompleksitas

Ini bukan estimasi waktu absolut, tapi perbandingan relatif antar fitur untuk membantu prioritisasi:

| Fitur | Kompleksitas | Alasan |
|---|---|---|
| Currency system (foundation) | Tinggi | Banyak tempat yang perlu diupdate, butuh schema change di banyak tabel |
| Payment accounts CRUD | Rendah | Tabel baru sederhana, UI Settings standar |
| Invoice & incoming payment | Tinggi | Schema baru kompleks, banyak relasi, banyak UI baru |
| PDF invoice & payslip | Sedang | Butuh library baru, design template, tapi logic terbatas |
| Platform/gateway fee fields | Rendah | Tambahan field di invoice, form tambahan |
| Rename leads + field baru | Rendah | Perubahan UI dan beberapa field baru |
| Kanban view | Sedang | Butuh library dnd-kit, refactor komponen list yang ada |
| Inline status edit | Rendah | Modifikasi komponen tabel yang sudah ada |
| Merge deliverable+file UI | Sedang | Refactor besar di UI proyek, tapi tidak ada schema change |
| Auto-progress dari tasks | Rendah | Database trigger, logika sederhana |
| Subtask indentasi UI | Rendah | Data sudah ada di DB, tinggal render tree |
| People performa dashboard | Sedang | Query agregasi kompleks, desain widget baru |
| Foto profil | Rendah | Storage bucket + upload form |
| Outreach tab | Rendah | Schema baru sederhana, UI baru tapi straightforward |
| Revenue per klien | Rendah | Query agregasi dari invoice, tambah kolom di tabel clients |
| Google Drive integration | Tinggi | Butuh API credential, error handling, async flow |
| Dashboard P&L | Sedang | Bergantung pada invoice system selesai dulu |
| Deadline history/audit | Rendah | Tabel log baru, trigger sederhana |

---

## Urutan yang Disarankan

Berdasarkan dependencies dan value yang dihasilkan per fase:

**Fase 1 (Foundation)** — harus duluan karena semua bergantung di sini:
- Currency system + FX rate management
- Payment accounts + Settings CRUD
- Selesaikan migrasi dropdown ke database

**Fase 2 (Finance Inbound)** — bisa mulai begitu Phase 1 selesai:
- Invoice + line items + incoming payment
- Platform fee & gateway fee per invoice
- Revenue per klien di halaman Clients

**Fase 3 (Dokumen)** — relatif independen:
- Invoice PDF generator
- Payslip PDF generator

**Fase 4 (Operasi UX)** — high impact, relatif independen dari finance:
- Rename Leads, field baru, posisi nav
- Inline lead-to-project conversion
- Void/problem flag + deadline history
- Merge deliverable+file+task jadi satu view
- Inline status edit dari tabel
- Tab Outreach

**Fase 5 (Views)** — perlu dnd-kit:
- Kanban di Projects
- Kanban di Tasks
- Subtask indentasi
- Auto-progress dari tasks

**Fase 6 (People)** — relatif independen:
- Foto profil
- Talent asset dashboard dengan metrik performa

**Fase 7 (Dashboard Finansial)** — butuh Phase 2 selesai dulu:
- Widget P&L
- Widget revenue & biaya
- Dual-currency di semua widget

**Fase 8 (Integrasi)** — butuh credential:
- Google Drive auto-folder creation

---

_Dokumen ini dibuat untuk keperluan brainstorming. Semua keputusan desain yang tercantum sebagai "pertimbangan" belum final dan masih terbuka untuk didiskusikan._
