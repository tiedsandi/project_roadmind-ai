import type { NextApiRequest, NextApiResponse } from "next";

import { GoogleGenAI } from "@google/genai";
import { roadmapRepository } from "@/repositories";
import type { RoadmapItem } from "@/repositories/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface GeneratedRoadmap {
  judul: string;
  subJudul: string;
  roadmap: RoadmapItem[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ id: string } | { message: string; raw?: string }>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { skill, days, userId } = req.body as {
    skill: string;
    days: number;
    userId: string;
  };

  if (!skill || !days || !userId) {
    return res
      .status(400)
      .json({ message: "Skill, days, dan userId wajib diisi" });
  }

  const prompt = `
Buat roadmap belajar ${skill} selama ${days} hari.
Output HARUS valid JSON tanpa backticks atau komentar.
Format:
{
  "judul": "Judul",
  "subJudul": "Sub Judul 1 sampai 2 kalimat sebagai deskripsi",
  "roadmap": [
    { "hari": 1, "kegiatan": "..." }
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

    let roadmapData: GeneratedRoadmap;
    try {
      roadmapData = JSON.parse(cleanText);
    } catch {
      return res.status(500).json({
        message: "Gagal parsing JSON dari AI",
        raw: cleanText,
      });
    }

    const id = await roadmapRepository.create({
      ...roadmapData,
      userId,
    });

    return res.status(200).json({ id });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Unknown error",
      raw: typeof err === "string" ? err : undefined,
    });
  }
}
