# PRD — Product Requirements Document

## RoadMind AI

---

## 1. Ringkasan Produk

**RoadMind AI** adalah web app berbasis AI yang membantu siapa saja belajar topik apa pun secara terstruktur. User cukup memasukkan topik dan durasi belajar, lalu AI membuatkan roadmap, cheat sheet, kuis, dan metode belajar lainnya secara otomatis.

---

## 2. Masalah yang Diselesaikan

- Banyak orang ingin belajar hal baru tapi bingung mulai dari mana
- Tidak punya mentor atau guide yang bisa menyusun rencana belajar
- Belajar sendiri sering tidak terstruktur dan mudah kehilangan motivasi
- Sulit mengukur kemajuan belajar sendiri

---

## 3. Target User

| Segmen              | Deskripsi                                                |
| ------------------- | -------------------------------------------------------- |
| **Self-learner**    | Orang yang ingin belajar skill baru secara mandiri       |
| **Mahasiswa**       | Butuh ringkasan dan rencana belajar untuk mata kuliah    |
| **Career switcher** | Orang yang mau pindah karir dan perlu roadmap skill baru |
| **Content creator** | Yang ingin mempelajari topik cepat untuk konten          |

---

## 4. Visi Produk

Menjadi **platform belajar personal bertenaga AI** yang paling mudah digunakan. Cukup ketik topik → dapat rencana belajar lengkap.

---

## 5. Value Proposition

- **Cepat**: Roadmap belajar jadi dalam hitungan detik
- **Personal**: Disesuaikan dengan topik dan durasi yang user mau
- **Terstruktur**: Belajar per hari dengan kegiatan yang jelas
- **Interaktif**: Ada kuis, teknik Feynman, dan progress tracking
- **Gratis untuk mulai**: Akses dasar tanpa biaya

---

## 6. Success Metrics

| Metric                            | Target                      |
| --------------------------------- | --------------------------- |
| User registered                   | 1.000 dalam 3 bulan pertama |
| Roadmap yang di-generate          | 5.000 dalam 3 bulan         |
| Retention (weekly active)         | > 30%                       |
| Completion rate (roadmap selesai) | > 15%                       |
| User satisfaction (rating)        | > 4.0 / 5.0                 |

---

## 7. Platform

- **Web app** (responsive, mobile-first)
- Framework: Next.js (Pages Router)
- Database: Firebase Firestore
- Auth: Firebase Authentication (Google Sign-In)
- AI: Google Gemini API

---

## 8. Monetisasi (Rencana)

| Model         | Deskripsi                                                |
| ------------- | -------------------------------------------------------- |
| **Freemium**  | Generate roadmap terbatas (misal 3/bulan)                |
| **Pro Plan**  | Unlimited generate + semua fitur (kuis, Feynman, export) |
| **Team Plan** | Untuk organisasi/kelas yang mau pakai bareng             |
