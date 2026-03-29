import { useEffect, useState } from "react";

import Modal from "@/components/Modal";
import { Plus, Trash2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { learningPlanRepository } from "@/repositories";
import type { LearningPlan } from "@/repositories/types";
import { useRouter } from "next/router";

const LEVELS = ["Pemula", "Menengah", "Mahir"];

export default function LearningPlanPage() {
  const [plans, setPlans] = useState<LearningPlan[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [topik, setTopik] = useState("");
  const [level, setLevel] = useState("Pemula");
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
    learningPlanRepository
      .getAllByUserId(userId)
      .then(setPlans)
      .catch(console.error);
  }, [userId, showModal, deleteId]);

  const handleGenerate = async () => {
    if (!userId || !topik) return;
    setLoading(true);
    const res = await fetch("/api/generateLearningPlan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topik, level, userId }),
    });
    const data = await res.json();
    setLoading(false);
    setShowModal(false);
    if (res.ok) router.push(`/learning-plan/${data.id}`);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await learningPlanRepository.delete(deleteId);
    setPlans((prev) => prev.filter((p) => p.id !== deleteId));
    setDeleting(false);
    setDeleteId(null);
  };

  if (!userId) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-16 py-12">
        <h1 className="text-3xl font-bold text-[#37352f] mb-2">
          20-Hour Learning Plan
        </h1>
        <p className="text-sm text-[#9b9a97]">
          Silakan login untuk mengakses fitur ini.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-16 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-[#37352f]">
            20-Hour Learning Plan
          </h1>
          <p className="text-[#9b9a97] mt-1 text-sm">
            Kuasai topik apa saja dalam 20 jam dengan prinsip 80/20
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#37352f] text-white rounded-md hover:bg-[#2f2d2a] transition-colors"
        >
          <Plus size={14} />
          New Plan
        </button>
      </div>

      <div className="mt-8">
        {plans.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[#9b9a97] text-sm mb-4">
              Belum ada learning plan. Buat yang pertama!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-[#e9e9e7] rounded-md text-[#37352f] hover:bg-[#f7f7f5] transition-colors"
            >
              <Plus size={14} />
              Buat Plan
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#e9e9e7]">
            {plans.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-md hover:bg-[#f7f7f5] transition-colors group"
              >
                <span className="text-base">⏱️</span>
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => router.push(`/learning-plan/${p.id}`)}
                >
                  <p className="text-sm font-medium text-[#37352f] group-hover:underline truncate">
                    {p.judul}
                  </p>
                  <p className="text-xs text-[#9b9a97] truncate mt-0.5">
                    {p.topik} · {p.level} · {p.totalJam} jam · {p.sesi.length}{" "}
                    sesi
                  </p>
                </div>
                <button
                  onClick={() => setDeleteId(p.id)}
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

      {/* Modal: Buat Plan */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(loading ? true : false)}
        >
          <h2 className="text-lg font-semibold text-[#37352f] mb-4">
            Buat Learning Plan Baru
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
                placeholder="Misal: Machine Learning"
                className="mt-1 w-full px-3 py-2 text-sm border border-[#e9e9e7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#37352f]/20 focus:border-[#37352f]/40"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#9b9a97] uppercase tracking-wide">
                Level Saat Ini
              </label>
              <div className="flex gap-2 mt-2">
                {LEVELS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLevel(l)}
                    className={`flex-1 py-1.5 text-sm rounded-md border transition-colors ${
                      level === l
                        ? "bg-[#37352f] text-white border-[#37352f]"
                        : "border-[#e9e9e7] text-[#37352f] hover:bg-[#f7f7f5]"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !topik}
              className="w-full py-2 text-sm bg-[#37352f] text-white rounded-md hover:bg-[#2f2d2a] transition-colors disabled:opacity-40"
            >
              {loading ? "Generating..." : "Generate Plan"}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Konfirmasi hapus */}
      {deleteId && (
        <Modal
          isOpen={!!deleteId}
          onClose={() => (deleting ? undefined : setDeleteId(null))}
        >
          <h2 className="text-base font-semibold text-[#37352f] mb-2">
            Hapus Learning Plan?
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
