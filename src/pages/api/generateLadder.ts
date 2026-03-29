import type { NextApiRequest, NextApiResponse } from "next";

import { GoogleGenAI } from "@google/genai";
import { learningLadderRepository } from "@/repositories";
import type { LadderLevel } from "@/repositories/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface GeneratedLadder {
  levels: LadderLevel[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ id: string } | { message: string; raw?: string }>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { topik, userId } = req.body as { topik: string; userId: string };

  if (!topik || !userId) {
    return res.status(400).json({ message: "topik dan userId wajib diisi" });
  }

  const prompt = `
Pecah "${topik}" menjadi tepat 5 tingkat kesulitan.
Tunjukkan cara naik dari Level 1 (pemula) ke Level 5 (mahir) dengan pencapaian yang jelas.
Tulis dalam Bahasa Indonesia.

Output HARUS valid JSON tanpa backticks atau komentar apapun.
Format:
{
  "levels": [
    {
      "level": 1,
      "nama": "Pemula",
      "deskripsi": "string (apa yang dipahami di level ini)",
      "milestone": "string (pencapaian konkret yang menandakan lulus level ini)",
      "skills": ["string", "string"],
      "project": "string (satu project kecil yang bisa dikerjakan di level ini)"
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

    let ladderData: GeneratedLadder;
    try {
      ladderData = JSON.parse(cleanText);
    } catch {
      return res.status(500).json({
        message: "Gagal parsing JSON dari AI",
        raw: cleanText,
      });
    }

    const id = await learningLadderRepository.create({
      topik,
      levels: ladderData.levels,
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
