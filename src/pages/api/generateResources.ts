import type { NextApiRequest, NextApiResponse } from "next";

import { GoogleGenAI } from "@google/genai";
import { resourceRepository } from "@/repositories";
import type { Resource } from "@/repositories/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface GeneratedResources {
  resources: Resource[];
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
Rekomendasikan tepat 5 sumber belajar terbaik untuk mempelajari "${topik}".
Pilih sumber yang beragam jenisnya (buku, video, kursus, artikel, atau tokoh).
Tiap sumber harus punya nama, jenis, alasan kenapa layak, dan link (jika relevan).
Tulis dalam Bahasa Indonesia.

Output HARUS valid JSON tanpa backticks atau komentar apapun.
Format:
{
  "resources": [
    {
      "nama": "string",
      "jenis": "Buku" | "Video" | "Kursus" | "Artikel" | "Tokoh",
      "alasan": "string (1-2 kalimat kenapa ini layak dipelajari)",
      "link": "string (URL jika tersedia, kosong jika tidak)"
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

    let resourceData: GeneratedResources;
    try {
      resourceData = JSON.parse(cleanText);
    } catch {
      return res.status(500).json({
        message: "Gagal parsing JSON dari AI",
        raw: cleanText,
      });
    }

    const id = await resourceRepository.create({
      topik,
      resources: resourceData.resources,
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
