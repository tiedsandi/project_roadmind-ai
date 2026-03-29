import type { NextApiRequest, NextApiResponse } from "next";

import { GoogleGenAI } from "@google/genai";
import { learningPlanRepository } from "@/repositories";
import type { LearningSession } from "@/repositories/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface GeneratedPlan {
  judul: string;
  deskripsi: string;
  totalJam: number;
  sesi: LearningSession[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ id: string } | { message: string; raw?: string }>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { topik, level, userId } = req.body as {
    topik: string;
    level: string;
    userId: string;
  };

  if (!topik || !level || !userId) {
    return res
      .status(400)
      .json({ message: "topik, level, dan userId wajib diisi" });
  }

  const prompt = `
Saya perlu mempelajari ${topik} dengan cepat. Level saya saat ini: ${level}.
Buatkan rencana belajar 20 jam yang fokus pada 20% materi yang menghasilkan 80% hasil.
Bagi menjadi tepat 10 sesi, masing-masing 2 jam.
Setiap sesi harus punya: tujuan, aktivitas, resource, dan review 15 menit di akhir.

Output HARUS valid JSON tanpa backticks atau komentar apapun.
Format:
{
  "judul": "string",
  "deskripsi": "string (1-2 kalimat)",
  "totalJam": 20,
  "sesi": [
    {
      "nomor": 1,
      "tujuan": "string",
      "aktivitas": "string (markdown boleh, gunakan bullet points)",
      "resource": "string",
      "review": "string"
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

    let planData: GeneratedPlan;
    try {
      planData = JSON.parse(cleanText);
    } catch {
      return res.status(500).json({
        message: "Gagal parsing JSON dari AI",
        raw: cleanText,
      });
    }

    const id = await learningPlanRepository.create({
      ...planData,
      topik,
      level,
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
