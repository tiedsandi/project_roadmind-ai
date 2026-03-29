# ARCHITECTURE — Arsitektur Teknis

## RoadMind AI

---

## 1. Tech Stack

| Layer         | Teknologi                           | Versi                    |
| ------------- | ----------------------------------- | ------------------------ |
| **Framework** | Next.js (Pages Router)              | 15.5.2                   |
| **UI**        | React + Tailwind CSS                | React 19.1.0, Tailwind 4 |
| **Language**  | TypeScript                          | 5.x                      |
| **Database**  | Firebase Firestore                  | 12.2.1                   |
| **Auth**      | Firebase Authentication (Google)    | 12.2.1                   |
| **AI**        | Google Gemini API (`@google/genai`) | 1.17.0                   |
| **Icon**      | Lucide React                        | 0.542.0                  |
| **Markdown**  | react-markdown                      | 10.1.0                   |

---

## 2. Repository Pattern

Semua operasi database diabstrak ke dalam **Repository Layer**. Tujuannya: kalau mau ganti Firebase ke PostgreSQL (atau database lain), cukup ubah **1 file** (`src/repositories/index.ts`) tanpa menyentuh halaman atau API route mana pun.

```
src/repositories/
  types.ts                              ← Shared TypeScript types (Roadmap, RoadmapItem, dll)
  IRoadmapRepository.ts                 ← Interface/kontrak operasi database
  index.ts                              ← Export provider aktif (ubah ini saat ganti DB)
  firebase/
    FirebaseRoadmapRepository.ts        ← Implementasi Firebase (saat ini aktif)
  postgres/ (contoh masa depan)
    PostgresRoadmapRepository.ts        ← Implementasi PostgreSQL (tinggal buat & swap)
```

**Cara ganti ke PostgreSQL:**

1. Buat `src/repositories/postgres/PostgresRoadmapRepository.ts` yang implements `IRoadmapRepository`
2. Di `src/repositories/index.ts`, ganti 1 baris import
3. Selesai — tidak ada file lain yang perlu disentuh

---

## 3. Struktur Folder

```
project_roadmind-ai-main/
├── docs/                       # Dokumentasi project
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── FEATURES.md
│   └── PROMPTS.md
├── public/                     # Static assets
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── Card.tsx            # Card wrapper
│   │   ├── Header.tsx          # Navbar + auth
│   │   ├── Input.tsx           # Input field reusable
│   │   └── Modal.tsx           # Modal dialog
│   ├── lib/
│   │   └── firebase.ts         # Firebase config & init
│   ├── pages/
│   │   ├── _app.tsx            # App wrapper + layout
│   │   ├── _document.tsx       # HTML document
│   │   ├── index.tsx           # Homepage (public blog)
│   │   ├── roadmind.tsx        # Dashboard (auth required)
│   │   ├── seed.tsx            # Seed dummy data
│   │   ├── api/
│   │   │   ├── generateRoadmap.ts  # API: generate roadmap via Gemini
│   │   │   └── hello.ts
│   │   └── roadmind/
│   │       └── [id].tsx        # Detail page per roadmap
│   └── styles/
│       └── globals.css         # Global styles + Tailwind
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── eslint.config.mjs
```

---

## 3. Skema Database (Firebase Firestore)

### Collection: `blogs`

Menyimpan semua roadmap yang di-generate.

| Field                | Type      | Deskripsi                       |
| -------------------- | --------- | ------------------------------- |
| `judul`              | string    | Judul roadmap                   |
| `subJudul`           | string    | Deskripsi singkat (1-2 kalimat) |
| `roadmap`            | array     | List kegiatan per hari          |
| `roadmap[].hari`     | number    | Nomor hari                      |
| `roadmap[].kegiatan` | string    | Aktivitas belajar (markdown)    |
| `userId`             | string    | Firebase Auth UID pembuat       |
| `createdAt`          | timestamp | Waktu pembuatan (server)        |

---

## 4. Flow Data

```
┌──────────┐     ┌─────────────────┐     ┌──────────────┐
│  User    │────▶│  Next.js Page   │────▶│  API Route   │
│  Browser │     │  (roadmind.tsx) │     │  /api/       │
│          │◀────│                 │◀────│  generate    │
└──────────┘     └─────────────────┘     │  Roadmap.ts  │
                                          └──────┬───────┘
                                                 │
                                          ┌──────▼───────┐
                                          │  Gemini AI   │
                                          │  (generate)  │
                                          └──────┬───────┘
                                                 │
                                          ┌──────▼───────┐
                                          │  Firestore   │
                                          │  (simpan)    │
                                          └──────────────┘
```

**Alur Generate Roadmap:**

1. User isi form (skill + jumlah hari) → klik "Generate"
2. Frontend POST ke `/api/generateRoadmap`
3. API kirim prompt ke Gemini AI
4. Gemini return JSON (judul, subJudul, roadmap[])
5. API simpan ke Firestore collection `blogs`
6. Return `docRef.id` ke frontend
7. Frontend redirect ke `/roadmind/{id}`

---

## 5. Authentication Flow

- Login via **Google Sign-In** (Firebase Auth popup)
- Auth state dikelola di `Header.tsx` via `onAuthStateChanged`
- Dashboard (`roadmind.tsx`) cek `userId` — kalau null, tampilkan pesan login
- Data di-filter per `userId` sehingga user hanya lihat miliknya

---

## 6. Environment Variables

| Variable                                   | Scope       | Deskripsi               |
| ------------------------------------------ | ----------- | ----------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Client      | Firebase API Key        |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Client      | Firebase Auth Domain    |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Client      | Firebase Project ID     |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Client      | Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Client      | FCM Sender ID           |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Client      | Firebase App ID         |
| `GEMINI_API_KEY`                           | Server only | Google Gemini API Key   |

---

## 7. Deployment

- **Platform**: Vercel (recommended untuk Next.js)
- **Build**: `next build`
- **Start**: `next start`
- Environment variables diset di Vercel dashboard
