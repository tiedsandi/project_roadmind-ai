import { useState } from "react";
import { useRouter } from "next/router";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { courseRepository } from "@/repositories";
import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewCoursePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUserId(u.uid);
        setDisplayName(u.displayName ?? u.email ?? "Anonymous");
      } else {
        setUserId(null);
      }
    });
    return () => unsub();
  }, []);

  const handleSubmit = async () => {
    if (!userId || !title.trim()) return;
    setSubmitting(true);
    try {
      const id = await courseRepository.create({
        title: title.trim(),
        description: description.trim(),
        creatorId: userId,
        creatorName: displayName,
      });
      router.push(`/courses/${id}`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  if (!userId) {
    return (
      <div className="max-w-xl mx-auto px-6 md:px-0 py-12">
        <p className="text-sm text-[#71717a]">
          Silakan login untuk membuat course.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 md:px-0 py-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-[#71717a] hover:text-zinc-900 transition-colors mb-6"
      >
        <ArrowLeft size={13} />
        Explore
      </Link>

      <h1 className="text-2xl font-bold text-zinc-900 mb-6">
        Buat Course Baru
      </h1>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-[#71717a] uppercase tracking-wide">
            Judul Course
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Misal: Belajar TypeScript dari Nol"
            className="mt-1 w-full px-3 py-2 text-sm border border-[#e4e4e7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#37352f]/20 focus:border-indigo-600/40"
            autoFocus
          />
        </div>

        <div>
          <label className="text-xs font-medium text-[#71717a] uppercase tracking-wide">
            Deskripsi
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Apa yang akan dipelajari di course ini?"
            rows={3}
            className="mt-1 w-full px-3 py-2 text-sm border border-[#e4e4e7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#37352f]/20 focus:border-indigo-600/40 resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting || !title.trim()}
          className="w-full py-2.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-40"
        >
          {submitting ? "Membuat..." : "Buat Course"}
        </button>
      </div>
    </div>
  );
}
