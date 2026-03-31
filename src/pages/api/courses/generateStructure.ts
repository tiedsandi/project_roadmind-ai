import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY! });

export interface GeneratedStructure {
  title: string;
  description: string;
  levels: string[];
  reasoning: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeneratedStructure | { message: string; raw?: string }>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { topic } = req.body as { topic: string };
  if (!topic || !topic.trim()) {
    return res.status(400).json({ message: "topic wajib diisi" });
  }

  const prompt = `Kamu adalah asisten perancang course belajar. User ingin belajar atau mengajarkan topik: "${topic.trim()}".

Tugasmu:
1. Buat judul course yang menarik dan spesifik (bukan hanya nama topiknya)
2. Buat deskripsi singkat course (2–3 kalimat, jelaskan apa yang akan dipelajari dan untuk siapa)
3. Rekomendasikan learning ladder — urutan level belajar yang masuk akal untuk topik ini (3–5 level)
4. Berikan reasoning singkat mengapa kamu memilih level-level tersebut

Output HARUS valid JSON tanpa backticks, markdown, atau komentar apapun:
{
  "title": "string (judul course menarik dan spesifik)",
  "description": "string (2–3 kalimat deskripsi)",
  "levels": ["string (nama level 1)", "string (nama level 2)", "..."],
  "reasoning": "string (1–2 kalimat alasan pemilihan level)"
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
    const parsed = JSON.parse(cleaned) as GeneratedStructure;

    if (
      !parsed.title ||
      !parsed.description ||
      !Array.isArray(parsed.levels) ||
      parsed.levels.length === 0
    ) {
      return res.status(502).json({ message: "Respons AI tidak valid", raw });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return res.status(500).json({ message: msg });
  }
}
