# RoadMind AI — Copilot Instructions

Kamu adalah AI coding assistant untuk project **RoadMind AI**.
Sebelum menulis kode apapun, ikuti aturan berikut:

## Konteks Project

RoadMind AI adalah web app pembelajaran berbasis AI.

- Framework: Next.js 15 (Pages Router) + TypeScript
- Database: Firebase Firestore
- Auth: Firebase Authentication (Google Sign-In)
- AI: Google Gemini API (`@google/genai`)
- Styling: Tailwind CSS v4
- Dokumentasi lengkap ada di folder `docs/`

## Aturan Coding

1. **Selalu gunakan TypeScript** — tidak boleh pakai `any` kecuali terpaksa
2. **Ikuti struktur folder yang ada**:
   - Halaman baru → `src/pages/`
   - Komponen reusable → `src/components/`
   - API route baru → `src/pages/api/`
3. **Format API response** selalu JSON, ikuti format di `docs/PROMPTS.md`
4. **Simpan data** ke Firestore, selalu sertakan `userId` dan `createdAt`
5. **Auth check** — halaman yang butuh login, cek `userId` dari `onAuthStateChanged`

## Saat Membuat Fitur Baru

1. Cek `docs/FEATURES.md` untuk spec fitur
2. Cek `docs/PROMPTS.md` untuk prompt AI yang digunakan
3. Ikuti pola yang sama dengan `src/pages/api/generateRoadmap.ts`
4. Gunakan komponen yang sudah ada (`Card`, `Input`, `Modal`, `Header`)

## Struktur Data Firestore

```
Collection: blogs
- judul: string
- subJudul: string
- roadmap: { hari: number, kegiatan: string }[]
- userId: string
- createdAt: Timestamp
```

## Referensi Dokumen

- Visi & bisnis → `docs/PRD.md`
- Teknis & arsitektur → `docs/ARCHITECTURE.md`
- Spesifikasi fitur → `docs/FEATURES.md`
- Semua prompt AI → `docs/PROMPTS.md`
