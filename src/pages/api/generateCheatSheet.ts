import type { NextApiRequest, NextApiResponse } from "next";

import { GoogleGenAI } from "@google/genai";
import { cheatSheetRepository } from "@/repositories";
import type { CheatSheetKonsep } from "@/repositories/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface GeneratedCheatSheet {
  judul: string;
  ringkasan: string;
  konsepUtama: CheatSheetKonsep[];
  tips: string[];
  kesalahanUmum: string[];
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
Rangkum konsep-konsep utama dari "${topik}" dalam satu cheat sheet.
Gunakan poin-poin dan contoh konkret agar bisa ditinjau dalam 5 menit.
Tulis dalam Bahasa Indonesia.

Output HARUS valid JSON tanpa backticks atau komentar apapun.
Format:
{
  "judul": "Cheat Sheet: ${topik}",
  "ringkasan": "string (1-2 kalimat deskripsi topik)",
  "konsepUtama": [
    {
      "nama": "string",
      "penjelasan": "string (singkat, padat)",
      "contoh": "string (contoh konkret atau kode)"
    }
  ],
  "tips": ["string", "string"],
  "kesalahanUmum": ["string", "string"]
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

    let sheetData: GeneratedCheatSheet;
    try {
      sheetData = JSON.parse(cleanText);
    } catch {
      return res.status(500).json({
        message: "Gagal parsing JSON dari AI",
        raw: cleanText,
      });
    }

    const id = await cheatSheetRepository.create({
      ...sheetData,
      topik,
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
