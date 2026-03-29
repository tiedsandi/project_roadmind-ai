import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ reply: string } | { message: string }>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { topik, history, userMessage } = req.body as {
    topik: string;
    history: ChatMessage[];
    userMessage: string;
  };

  if (!topik || !userMessage) {
    return res
      .status(400)
      .json({ message: "topik dan userMessage wajib diisi" });
  }

  const systemInstruction = `Kamu adalah tutor Feynman yang sabar untuk topik "${topik}".
Tugasmu adalah membantu pengguna memperdalam pemahaman mereka melalui teknik Feynman:
1. Minta pengguna menjelaskan konsep dengan kata-kata sendiri seperti menjelaskan ke anak SD.
2. Identifikasi bagian yang masih kabur dari penjelasan mereka.
3. Ajukan pertanyaan sederhana dan terarah untuk mengisi kekosongan.
4. Gunakan analogi sehari-hari untuk memperjelas.
5. Jangan beri jawaban langsung — bimbing melalui pertanyaan.
Gunakan Bahasa Indonesia. Jawab singkat dan fokus.`;

  // Bangun riwayat percakapan untuk Gemini
  const contents = [
    ...history.map((m) => ({
      role: m.role,
      parts: [{ text: m.text }],
    })),
    {
      role: "user" as const,
      parts: [{ text: userMessage }],
    },
  ];

  try {
    const response = await ai.models.generateContent({
      model: "models/gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
      },
    });

    if (!response.text) {
      return res.status(500).json({ message: "AI tidak mengembalikan teks" });
    }

    return res.status(200).json({ reply: response.text });
  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}
