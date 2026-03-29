import type { NextApiRequest, NextApiResponse } from "next";

import { GoogleGenAI } from "@google/genai";
import { quizRepository } from "@/repositories";
import type { QuizQuestion } from "@/repositories/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface GeneratedQuiz {
  questions: QuizQuestion[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ id: string } | { message: string; raw?: string }>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const {
    topik,
    jumlah = 10,
    userId,
  } = req.body as {
    topik: string;
    jumlah?: number;
    userId: string;
  };

  if (!topik || !userId) {
    return res.status(400).json({ message: "topik dan userId wajib diisi" });
  }

  const safeJumlah = Math.min(Math.max(Number(jumlah) || 10, 5), 20);

  const prompt = `
Buat ${safeJumlah} soal pilihan ganda tentang "${topik}".
Soal harus menguji pemahaman konsep, bukan hafalan semata.
Tulis dalam Bahasa Indonesia.

Output HARUS valid JSON tanpa backticks atau komentar apapun.
Format:
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
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents: prompt,
    });

    if (!response.text) {
      return res.status(500).json({ message: "AI tidak mengembalikan teks" });
    }

    const cleanText = response.text.replace(/```json|```/gi, "").trim();

    let quizData: GeneratedQuiz;
    try {
      quizData = JSON.parse(cleanText);
    } catch {
      return res.status(500).json({
        message: "Gagal parsing JSON dari AI",
        raw: cleanText,
      });
    }

    const id = await quizRepository.create({
      topik,
      jumlah: quizData.questions.length,
      questions: quizData.questions,
      userId,
    });

    return res.status(200).json({ id });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
