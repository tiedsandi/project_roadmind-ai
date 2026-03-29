"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";

import { db } from "@/lib/firebase";
import { useEffect } from "react";

const dummyBlogs = [
  {
    judul: "Roadmap Belajar Public Speaking",
    subJudul: "Latihan komunikasi efektif dalam 14 hari",
    roadmap: [
      {
        hari: 1,
        tanggal: "2025-09-07",
        kegiatan: "Pelajari dasar body language",
      },
      { hari: 2, tanggal: "2025-09-08", kegiatan: "Latihan intonasi suara" },
    ],
  },
  {
    judul: "Roadmap Belajar React.js",
    subJudul: "Dasar hingga project kecil dalam 21 hari",
    roadmap: [
      {
        hari: 1,
        tanggal: "2025-09-07",
        kegiatan: "Instalasi Node.js dan setup project",
      },
      { hari: 2, tanggal: "2025-09-08", kegiatan: "Belajar JSX & Components" },
    ],
  },
  {
    judul: "Roadmap Belajar Public Speaking untuk Pemula",
    subJudul: "Mengatasi rasa takut panggung dalam 10 hari",
    roadmap: [
      { hari: 1, tanggal: "2025-09-07", kegiatan: "Latihan pernapasan" },
      { hari: 2, tanggal: "2025-09-08", kegiatan: "Rekam suara sendiri" },
    ],
  },
  {
    judul: "Roadmap Belajar Laravel",
    subJudul: "Fundamental Laravel dalam 14 hari",
    roadmap: [
      {
        hari: 1,
        tanggal: "2025-09-07",
        kegiatan: "Setup Laravel & Routing dasar",
      },
      { hari: 2, tanggal: "2025-09-08", kegiatan: "Controller & Views" },
    ],
  },
  {
    judul: "Roadmap Belajar Node.js",
    subJudul: "Dasar Node.js dalam 7 hari",
    roadmap: [
      { hari: 1, tanggal: "2025-09-07", kegiatan: "Belajar module system" },
      { hari: 2, tanggal: "2025-09-08", kegiatan: "Express.js dasar" },
    ],
  },
  {
    judul: "Roadmap Belajar Go",
    subJudul: "Pemahaman dasar Go dalam 14 hari",
    roadmap: [
      { hari: 1, tanggal: "2025-09-07", kegiatan: "Setup Go environment" },
      {
        hari: 2,
        tanggal: "2025-09-08",
        kegiatan: "Belajar tipe data & variabel",
      },
    ],
  },
];

export default function SeedPage() {
  useEffect(() => {
    const seedData = async () => {
      try {
        for (const blog of dummyBlogs) {
          await addDoc(collection(db, "blogs"), {
            ...blog,
            createdAt: serverTimestamp(),
          });
        }
        console.log("✅ 6 blogs berhasil dimasukkan ke Firestore!");
      } catch (err) {
        console.error("❌ Gagal seed data:", err);
      }
    };

    seedData();
  }, []);

  return (
    <div className="p-8 text-center">
      <h1 className="text-xl font-bold">Seeding Data...</h1>
      <p>Cek console dan Firestore collection blogs.</p>
    </div>
  );
}
