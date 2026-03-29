# PROMPTS — Library Prompt AI

## RoadMind AI

---

## Panduan Umum

- Semua prompt dikirim ke **Google Gemini 2.5 Flash**
- Output selalu diminta dalam format **JSON valid** tanpa backticks
- Bahasa output: **Bahasa Indonesia**
- Setiap prompt menyisipkan variabel dari user: `{topic}`, `{days}`, dll.

---

## 1. Generate Roadmap (Existing)

**Status**: ✅ Aktif | **API**: `/api/generateRoadmap`

**Prompt**:

```
Buat roadmap belajar {skill} selama {days} hari.
Output HARUS valid JSON tanpa backticks atau komentar.
Format:
{
  "judul": "Judul",
  "subJudul": "Sub Judul 1 sampai 2 kalimat sebagai deskripsi",
  "roadmap": [
    { "hari": 1, "kegiatan": "..." }
  ]
}
```

**Input**: `skill` (string), `days` (number)
**Output JSON**:

```json
{
  "judul": "string",
  "subJudul": "string",
  "roadmap": [{ "hari": 1, "kegiatan": "string (markdown)" }]
}
```

---

## 2. 20-Hour Learning Plan

**Status**: 📋 Direncanakan | **API**: `/api/generateLearningPlan`

**System Prompt**:

```
Kamu adalah perencana belajar ahli. Tugasmu membuat rencana belajar 20 jam yang efisien dengan prinsip Pareto (fokus 20% materi yang menghasilkan 80% hasil).
```

**User Prompt**:

```
Saya perlu mempelajari {topic} dengan cepat.
Buatkan rencana 20 jam yang fokus pada 20% materi yang menghasilkan 80% hasil.
Bagi menjadi 10 sesi, masing-masing 2 jam.
Setiap sesi harus punya: tujuan, aktivitas, resource, dan review 15 menit di akhir.

Output HARUS valid JSON tanpa backticks atau komentar.
Format:
{
  "judul": "string",
  "deskripsi": "string",
  "totalJam": 20,
  "sesi": [
    {
      "nomor": 1,
      "tujuan": "string",
      "aktivitas": "string (markdown)",
      "resource": "string",
      "review": "string"
    }
  ]
}
```

---

## 3. Cheat Sheet Generator

**Status**: 📋 Direncanakan | **API**: `/api/generateCheatSheet`

**User Prompt**:

```
Rangkum konsep-konsep utama dari {topic} dalam satu halaman.
Gunakan poin-poin, diagram teks, dan contoh agar bisa ditinjau dalam 5 menit.
Tulis dalam Bahasa Indonesia.

Output HARUS valid JSON tanpa backticks atau komentar.
Format:
{
  "judul": "Cheat Sheet: {topic}",
  "ringkasan": "string (1-2 kalimat)",
  "konsepUtama": [
    {
      "nama": "string",
      "penjelasan": "string",
      "contoh": "string"
    }
  ],
  "tips": ["string"],
  "kesalahan_umum": ["string"]
}
```

---

## 4. Quiz Engine

**Status**: 📋 Direncanakan | **API**: `/api/generateQuiz`

**System Prompt**:

```
Kamu adalah penguji yang adil dan edukatif. Buat soal yang menguji pemahaman, bukan hafalan. Tingkat kesulitan harus naik bertahap.
```

**User Prompt**:

```
Saya baru saja mempelajari {topic}.
Berikan 10 pertanyaan yang semakin sulit untuk menguji pemahaman saya.
Untuk setiap soal, sertakan: pertanyaan, pilihan jawaban (A-D), jawaban benar, dan penjelasan.

Output HARUS valid JSON tanpa backticks atau komentar.
Format:
{
  "topik": "{topic}",
  "soal": [
    {
      "nomor": 1,
      "level": "mudah|sedang|sulit",
      "pertanyaan": "string",
      "pilihan": {
        "A": "string",
        "B": "string",
        "C": "string",
        "D": "string"
      },
      "jawaban": "A",
      "penjelasan": "string"
    }
  ]
}
```

---

## 5. Learning Ladder

**Status**: 📋 Direncanakan | **API**: `/api/generateLadder`

**User Prompt**:

```
Pecah {topic} menjadi 5 tingkat kesulitan.
Tunjukkan cara naik dari Level 1 (pemula) ke Level 5 (mahir) dengan pencapaian yang jelas di setiap langkah.

Output HARUS valid JSON tanpa backticks atau komentar.
Format:
{
  "topik": "{topic}",
  "levels": [
    {
      "level": 1,
      "nama": "Pemula",
      "deskripsi": "string",
      "milestone": "string",
      "skills": ["string"],
      "project": "string"
    }
  ]
}
```

---

## 6. Resource Finder

**Status**: 📋 Direncanakan | **API**: `/api/generateResources`

**User Prompt**:

```
Daftarkan 5 sumber terbaik (buku, video, kursus, atau tokoh) untuk mempelajari {topic} dengan cepat.
Jelaskan mengapa masing-masing layak untuk waktu saya.

Output HARUS valid JSON tanpa backticks atau komentar.
Format:
{
  "topik": "{topic}",
  "resources": [
    {
      "nama": "string",
      "jenis": "buku|video|kursus|tokoh|website",
      "deskripsi": "string",
      "alasan": "string",
      "link": "string (jika ada)"
    }
  ]
}
```

---

## 7. Feynman Loop

**Status**: 📋 Direncanakan | **API**: `/api/feynman`

Berbeda dari prompt lainnya — ini bersifat **conversational** (multi-turn), bukan single-shot.

**System Prompt**:

```
Kamu adalah guru ahli yang menggunakan Teknik Feynman. Tugasmu:
1. Jelaskan topik dengan istilah paling sederhana dan analogi
2. Minta user menjelaskan ulang dengan kata sendiri
3. Identifikasi celah/gap pemahaman
4. Ajarkan kembali bagian yang kurang
5. Ulangi sampai user bisa menjelaskan dengan lancar
6. Buat "teaching snapshot" sebagai rangkuman final

Gunakan analogi di setiap penjelasan. Hindari jargon. Prioritaskan pemahaman di atas hafalan.
```

**Flow**:
| Step | AI Action | User Action |
|---|---|---|
| 1 | Jelaskan topik sederhana + analogi | Baca dan pahami |
| 2 | Tanya: "Coba jelaskan ulang dengan kata-katamu" | Jelaskan ulang |
| 3 | Identifikasi gap + re-teach | Perbaiki pemahaman |
| 4 | Ulangi step 2-3 (2-3 siklus) | Jelaskan lagi |
| 5 | Beri tantangan aplikasi | Jawab tantangan |
| 6 | Buat teaching snapshot | Simpan |

**Output Teaching Snapshot (JSON)**:

```json
{
  "topik": "string",
  "penjelasanSederhana": "string",
  "analogi": "string",
  "poinPenting": ["string"],
  "kesalahanUmum": ["string"],
  "satuKalimat": "string (rangkuman dalam 1 kalimat)"
}
```

---

## Catatan Versioning Prompt

Ketika prompt diubah/ditingkatkan, update versi di sini:

| Prompt           | Versi | Terakhir Diubah |
| ---------------- | ----- | --------------- |
| Generate Roadmap | v1.0  | - (existing)    |
| 20-Hour Plan     | v0.1  | draft           |
| Cheat Sheet      | v0.1  | draft           |
| Quiz Engine      | v0.1  | draft           |
| Learning Ladder  | v0.1  | draft           |
| Resource Finder  | v0.1  | draft           |
| Feynman Loop     | v0.1  | draft           |
