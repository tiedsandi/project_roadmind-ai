import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenAI } from "@google/genai";
import type { QuizQuestion } from "@/repositories/types";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    { questions: QuizQuestion[] } | { message: string; raw?: string }
  >,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const {
    courseTitle,
    levelName,
    jumlah = 10,
  } = req.body as {
    courseTitle: string;
    levelName: string;
    jumlah?: number;
  };

  if (!courseTitle || !levelName) {
    return res
      .status(400)
      .json({ message: "courseTitle dan levelName wajib diisi" });
  }

  const safeJumlah = Math.min(Math.max(Number(jumlah) || 10, 5), 20);

  const prompt = `Buat ${safeJumlah} soal pilihan ganda untuk topik "${courseTitle} — ${levelName}".
Soal harus menguji pemahaman konsep, bukan hafalan. Tulis dalam Bahasa Indonesia.
Output HARUS valid JSON tanpa backticks atau komentar:
{
  "questions": [
    {
      "nomor": 1,
      "pertanyaan": "string",
      "pilihan": ["A. string", "B. string", "C. string", "D. string"],
      "jawaban": "A",
      "penjelasan": "string (kenapa jawaban ini benar)"
    }
  ]
}`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.AI_MODEL ?? "gemini-2.5-flash",
      contents: prompt,
    });

    if (!response.text) {
      return res.status(500).json({ message: "AI tidak mengembalikan teks" });
    }

    const cleanText = response.text.replace(/```json|```/gi, "").trim();

    let parsed: { questions: QuizQuestion[] };
    try {
      parsed = JSON.parse(cleanText);
    } catch {
      return res.status(500).json({
        message: "Gagal parsing JSON dari AI",
        raw: cleanText,
      });
    }

    return res.status(200).json({ questions: parsed.questions });
  } catch (err) {
    console.error("generateQuiz error:", err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
