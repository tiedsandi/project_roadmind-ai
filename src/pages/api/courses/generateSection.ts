import type { NextApiRequest, NextApiResponse } from "next";

import { GoogleGenAI } from "@google/genai";
import { sectionRepository } from "@/repositories";
import type {
  SectionType,
  SectionContent,
  LearningPlanContent,
  CheatSheetContent,
  ResourcesContent,
  QuizConfigContent,
} from "@/repositories/types";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

function buildPrompt(
  type: SectionType,
  courseTitle: string,
  levelName: string,
): string {
  const topik = `"${courseTitle} — ${levelName}"`;

  switch (type) {
    case "learning-plan":
      return `Buat rencana belajar 20 jam untuk topik ${topik}.
Buat tepat 10 sesi, masing-masing 2 jam. Tulis dalam Bahasa Indonesia.
Output HARUS valid JSON tanpa backticks atau komentar:
{
  "sesi": [
    {
      "nomor": 1,
      "kegiatan": "string (deskripsi kegiatan belajar)",
      "durasi_menit": 120,
      "resource": "string (buku/video/latihan yang dipakai)",
      "review": "string (cara mengukur pemahaman di akhir sesi)"
    }
  ]
}`;

    case "cheat-sheet":
      return `Buat cheat sheet komprehensif untuk topik ${topik}.
Sertakan 5-8 konsep utama. Tulis dalam Bahasa Indonesia.
Output HARUS valid JSON tanpa backticks atau komentar:
{
  "ringkasan": "string (1-2 kalimat gambaran topik)",
  "konsep": [
    { "nama": "string", "penjelasan": "string (1-2 kalimat)", "contoh": "string (contoh konkret)" }
  ],
  "tips": ["string (tips praktis)"],
  "kesalahanUmum": ["string (kesalahan yang sering dilakukan pemula)"]
}`;

    case "resources":
      return `Rekomendasikan tepat 5 sumber belajar terbaik untuk topik ${topik}.
Pilih yang beragam jenisnya. Tulis dalam Bahasa Indonesia.
Output HARUS valid JSON tanpa backticks atau komentar:
{
  "resources": [
    {
      "nama": "string",
      "jenis": "Buku" | "Video" | "Kursus" | "Artikel" | "Tokoh",
      "alasan": "string (1-2 kalimat alasan layak dipelajari)",
      "link": "string (URL jika ada, kosong jika tidak)"
    }
  ]
}`;

    case "quiz-config":
      return `Identifikasi 8-10 topik/sub-topik penting yang perlu diuji dari ${topik}.
Ini akan digunakan sebagai kisi-kisi quiz. Tulis dalam Bahasa Indonesia.
Output HARUS valid JSON tanpa backticks atau komentar:
{
  "kisi_kisi": ["string (topik yang diuji)"]
}`;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    { content: SectionContent } | { message: string; raw?: string }
  >,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { courseId, levelId, sectionId, type, courseTitle, levelName } =
    req.body as {
      courseId: string;
      levelId: string;
      sectionId: string;
      type: SectionType;
      courseTitle: string;
      levelName: string;
    };

  if (
    !courseId ||
    !levelId ||
    !sectionId ||
    !type ||
    !courseTitle ||
    !levelName
  ) {
    return res.status(400).json({ message: "Parameter tidak lengkap" });
  }

  const prompt = buildPrompt(type, courseTitle, levelName);

  try {
    const response = await ai.models.generateContent({
      model: process.env.AI_MODEL ?? "gemini-2.5-flash",
      contents: prompt,
    });

    if (!response.text) {
      return res.status(500).json({ message: "AI tidak mengembalikan teks" });
    }

    const cleanText = response.text.replace(/```json|```/gi, "").trim();

    let parsed: SectionContent;
    try {
      parsed = JSON.parse(cleanText) as
        | LearningPlanContent
        | CheatSheetContent
        | ResourcesContent
        | QuizConfigContent;
    } catch {
      return res.status(500).json({
        message: "Gagal parsing JSON dari AI",
        raw: cleanText,
      });
    }

    await sectionRepository.updateContent(courseId, levelId, sectionId, parsed);

    return res.status(200).json({ content: parsed });
  } catch (err) {
    console.error("generateSection error:", err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
