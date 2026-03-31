import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenAI } from "@google/genai";
import type { GeneratedStructure } from "./generateStructure";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    { structure: GeneratedStructure; reply: string } | { message: string }
  >,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { current, feedback } = req.body as {
    current: GeneratedStructure;
    feedback: string;
  };

  if (!current || !feedback?.trim()) {
    return res
      .status(400)
      .json({ message: "current dan feedback wajib diisi" });
  }

  const prompt = `Kamu adalah asisten perancang course belajar. Berikut adalah struktur course yang sudah ada:

Judul: ${current.title}
Deskripsi: ${current.description}
Level saat ini: ${current.levels.join(", ")}

Creator memberikan feedback: "${feedback.trim()}"

Tugasmu:
1. Update struktur course sesuai feedback (judul, deskripsi, dan/atau level)
2. Berikan balasan singkat yang menjelaskan apa yang kamu ubah (1–2 kalimat, ramah dan informatif)

Output HARUS valid JSON tanpa backticks atau komentar:
{
  "structure": {
    "title": "string",
    "description": "string",
    "levels": ["string", "..."],
    "reasoning": "string"
  },
  "reply": "string (balasan ke creator tentang apa yang diubah)"
}`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.AI_MODEL ?? "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { temperature: 0.7 },
    });

    const raw = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const cleaned = raw
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleaned) as {
      structure: GeneratedStructure;
      reply: string;
    };

    return res.status(200).json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ message: msg });
  }
}
