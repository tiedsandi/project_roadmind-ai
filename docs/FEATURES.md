# FEATURES — Spesifikasi Fitur

## RoadMind AI

---

## Legenda Status

| Status            | Emoji |
| ----------------- | ----- |
| Selesai           | ✅    |
| Sedang dikerjakan | 🔧    |
| Direncanakan      | 📋    |

---

## Fase 1 — MVP (Saat Ini) ✅

Fitur dasar yang sudah ada di codebase.

### 1.1 Generate Roadmap ✅

- **Input**: Skill (topik) + Jumlah hari
- **Output**: Roadmap belajar per hari dengan kegiatan
- **AI**: Gemini 2.5 Flash
- **Storage**: Firestore collection `blogs`
- **Halaman**: Modal di `/roadmind`

### 1.2 Dashboard User ✅

- Lihat semua roadmap milik user
- Buat roadmap baru via modal
- Hapus roadmap dengan konfirmasi
- Filter berdasarkan `userId`

### 1.3 Detail Roadmap ✅

- Halaman `/roadmind/[id]`
- Tampilkan judul, sub-judul, dan list kegiatan per hari
- Render markdown di kegiatan

### 1.4 Authentication ✅

- Google Sign-In via Firebase Auth
- State auth di Header
- Dashboard hanya bisa diakses user yang login

### 1.5 Public Blog ✅

- Homepage menampilkan semua roadmap public
- Search/filter berdasarkan judul
- Bisa diakses tanpa login

### 1.6 Seed Data ✅

- Halaman `/seed` untuk insert dummy data

---

## Fase 2 — Metode Belajar AI 📋

Fitur baru berbasis 6 prompt AI yang akan diintegrasikan ke dalam setiap learning path.

### 2.1 20-Hour Learning Plan 📋

- **Input**: Topik + level awal
- **Output**: 10 sesi × 2 jam focused pada 20% yang menghasilkan 80% hasil
- Tiap sesi: tujuan, aktivitas, resource, review 15 menit
- Bisa dijadikan as a standalone atau pelengkap roadmap

### 2.2 Cheat Sheet Generator 📋

- **Input**: Topik
- **Output**: Rangkuman 1 halaman (poin, contoh, diagram teks)
- Format: Markdown yang di-render jadi 1 halaman ringkas
- Bisa di-generate dari roadmap yang sudah ada

### 2.3 Quiz Engine 📋

- **Input**: Topik (atau dari roadmap tertentu)
- **Output**: 10 soal progresif (mudah → sulit)
- Interaktif: user jawab 1 per 1, AI grading + feedback
- Simpan skor dan history

### 2.4 Learning Ladder 📋

- **Input**: Topik
- **Output**: 5 level (pemula → mahir) dengan milestone tiap level
- Visualisasi: tangga/progress bar
- User bisa tandai level yang sudah dicapai

### 2.5 Resource Finder 📋

- **Input**: Topik
- **Output**: Top 5 sumber belajar (buku, video, kursus, tokoh)
- Tiap resource: nama, jenis, alasan kenapa layak
- Bisa diintegrasikan ke tiap sesi learning plan

### 2.6 Feynman Loop 📋

- **Input**: Topik + level pemahaman
- **Flow**:
  1. AI jelaskan topik dengan analogi sederhana
  2. User jelaskan ulang dengan kata sendiri
  3. AI identifikasi gap dan re-teach
  4. Ulangi sampai paham
  5. Buat "teaching snapshot" final
- Mode: Conversational (chat-like interface)

---

## Fase 3 — Engagement & Platform 📋

### 3.1 Progress Tracking 📋

- Tandai kegiatan per hari sebagai selesai
- Persentase progress per roadmap
- Dashboard overview: total progress semua roadmap

### 3.2 Workspace / Folder 📋

- Grouping roadmap ke dalam folder/project
- Label/tag per roadmap

### 3.3 Export & Share 📋

- Export roadmap / cheat sheet ke PDF
- Share link publik per roadmap
- Embed widget

### 3.4 Gamification 📋

- Daily streak (hari berturut-turut belajar)
- Badge / achievement berdasarkan milestone
- Leaderboard opsional

### 3.5 Notifikasi & Reminder 📋

- Reminder harian via email atau push notification
- Pengingat untuk lanjut belajar

---

## Fase 4 — Monetisasi 📋

### 4.1 Usage Limit (Free Tier) 📋

- Batasi jumlah generate per bulan (misal 3)
- Batasi fitur tertentu (quiz, Feynman hanya Pro)

### 4.2 Pro Plan 📋

- Unlimited generate
- Semua fitur terbuka
- Priority AI response

### 4.3 Team Plan 📋

- Shared workspace untuk tim/kelas
- Admin dashboard
