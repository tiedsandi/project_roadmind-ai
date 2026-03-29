import { useEffect, useState } from "react";

import Modal from "@/components/Modal";
import { Plus, Trash2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { learningLadderRepository } from "@/repositories";
import type { LearningLadder } from "@/repositories/types";
import { useRouter } from "next/router";

export default function LadderPage() {
  const [ladders, setLadders] = useState<LearningLadder[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [topik, setTopik] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUserId(u ? u.uid : null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userId) return;
    learningLadderRepository
      .getAllByUserId(userId)
      .then(setLadders)
      .catch(console.error);
  }, [userId, showModal, deleteId]);

  const handleGenerate = async () => {
    if (!userId || !topik) return;
    setLoading(true);
    const res = await fetch("/api/generateLadder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topik, userId }),
    });
    const data = await res.json();
    setLoading(false);
    setShowModal(false);
    if (res.ok) router.push(`/ladder/${data.id}`);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await learningLadderRepository.delete(deleteId);
    setLadders((prev) => prev.filter((l) => l.id !== deleteId));
    setDeleting(false);
    setDeleteId(null);
  };

  if (!userId) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-16 py-12">
        <h1 className="text-3xl font-bold text-[#37352f] mb-2">
          Learning Ladder
        </h1>
        <p className="text-sm text-[#9b9a97]">
          Silakan login untuk mengakses fitur ini.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-16 py-12">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-[#37352f]">Learning Ladder</h1>
          <p className="text-[#9b9a97] mt-1 text-sm">
            Jalur naik dari pemula ke mahir dalam 5 level
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#37352f] text-white rounded-md hover:bg-[#2f2d2a] transition-colors"
        >
          <Plus size={14} />
          New Ladder
        </button>
      </div>

      <div className="mt-8">
        {ladders.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[#9b9a97] text-sm mb-4">
              Belum ada learning ladder. Buat yang pertama!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-[#e9e9e7] rounded-md text-[#37352f] hover:bg-[#f7f7f5] transition-colors"
            >
              <Plus size={14} />
              Buat Ladder
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#e9e9e7]">
            {ladders.map((l) => (
              <div
                key={l.id}
                className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-md hover:bg-[#f7f7f5] transition-colors group"
              >
                <span className="text-base">🪜</span>
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => router.push(`/ladder/${l.id}`)}
                >
                  <p className="text-sm font-medium text-[#37352f] group-hover:underline truncate">
                    {l.topik}
                  </p>
                  <p className="text-xs text-[#9b9a97] mt-0.5">
                    {l.levels.length} level
                  </p>
                </div>
                <button
                  onClick={() => setDeleteId(l.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-[#e9e9e7] text-[#9b9a97] hover:text-red-500 transition-all"
                  aria-label="Hapus"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(loading ? true : false)}
        >
          <h2 className="text-lg font-semibold text-[#37352f] mb-4">
            Buat Learning Ladder Baru
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#9b9a97] uppercase tracking-wide">
                Topik
              </label>
              <input
                type="text"
                value={topik}
                onChange={(e) => setTopik(e.target.value)}
                placeholder="Misal: Data Science"
                className="mt-1 w-full px-3 py-2 text-sm border border-[#e9e9e7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#37352f]/20 focus:border-[#37352f]/40"
                onKeyDown={(e) =>
                  e.key === "Enter" && !loading && topik && handleGenerate()
                }
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !topik}
              className="w-full py-2 text-sm bg-[#37352f] text-white rounded-md hover:bg-[#2f2d2a] transition-colors disabled:opacity-40"
            >
              {loading ? "Generating..." : "Generate Ladder"}
            </button>
          </div>
        </Modal>
      )}

      {deleteId && (
        <Modal
          isOpen={!!deleteId}
          onClose={() => (deleting ? undefined : setDeleteId(null))}
        >
          <h2 className="text-base font-semibold text-[#37352f] mb-2">
            Hapus Learning Ladder?
          </h2>
          <p className="text-sm text-[#9b9a97] mb-6">
            Tindakan ini tidak bisa dibatalkan.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteId(null)}
              disabled={deleting}
              className="px-3 py-1.5 text-sm border border-[#e9e9e7] rounded-md text-[#37352f] hover:bg-[#f7f7f5] transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
