import { useEffect, useState } from "react";

import Modal from "@/components/Modal";
import { Plus, Trash2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { roadmapRepository, progressRepository } from "@/repositories";
import type { Roadmap } from "@/repositories/types";
import { useRouter } from "next/router";

export default function RoadmindDashboard() {
  const [showModal, setShowModal] = useState(false);
  const [skill, setSkill] = useState("");
  const [days, setDays] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [roadminds, setRoadminds] = useState<Roadmap[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const fetchRoadminds = async () => {
      const data = await roadmapRepository.getAllByUserId(userId);
      setRoadminds(data);
      // Load progress untuk semua roadmap sekaligus
      const entries = await Promise.all(
        data.map(async (r) => {
          const p = await progressRepository.get(userId, r.id);
          const pct =
            r.roadmap.length > 0 && p
              ? Math.round((p.completedDays.length / r.roadmap.length) * 100)
              : 0;
          return [r.id, pct] as [string, number];
        }),
      );
      setProgressMap(Object.fromEntries(entries));
    };
    fetchRoadminds();
  }, [userId, showModal, deleteId]);

  const handleGenerate = async () => {
    if (!userId) return;
    setLoading(true);

    const res = await fetch("/api/generateRoadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill, days, userId }),
    });

    const data = await res.json();
    setLoading(false);
    setShowModal(false);

    if (res.ok) {
      router.push(`/roadmind/${data.id}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await roadmapRepository.delete(deleteId);
    setRoadminds((prev) => prev.filter((r) => r.id !== deleteId));
    setDeleting(false);
    setDeleteId(null);
  };

  if (!userId) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-16 py-12">
        <h1 className="text-3xl font-bold text-[#37352f] mb-2">My Roadmaps</h1>
        <p className="text-sm text-[#9b9a97]">
          Silakan login untuk mengakses dashboard kamu.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 md:px-16 py-12">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#37352f]">My Roadmaps</h1>
          <p className="text-[#9b9a97] mt-1 text-sm">
            {roadminds.length} roadmap
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#37352f] text-white rounded-md hover:bg-[#2f2d2a] transition-colors"
        >
          <Plus size={14} />
          New Roadmap
        </button>
      </div>

      {/* List */}
      {roadminds.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[#9b9a97] text-sm mb-4">
            Belum ada roadmap. Buat yang pertama!
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm border border-[#e9e9e7] rounded-md text-[#37352f] hover:bg-[#f7f7f5] transition-colors"
          >
            <Plus size={14} />
            Buat Roadmap
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[#e9e9e7]">
          {roadminds.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 py-2.5 px-2 -mx-2 rounded-md hover:bg-[#f7f7f5] transition-colors group"
            >
              <span className="text-base">📚</span>
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => router.push(`/roadmind/${r.id}`)}
              >
                <p className="text-sm font-medium text-[#37352f] group-hover:underline truncate">
                  {r.judul}
                </p>
                <p className="text-xs text-[#9b9a97] truncate mt-0.5">
                  {r.subJudul}
                </p>
                {/* Mini progress bar */}
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1 bg-[#e9e9e7] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#37352f] rounded-full transition-all duration-300"
                      style={{ width: `${progressMap[r.id] ?? 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[#9b9a97] flex-shrink-0">
                    {progressMap[r.id] ?? 0}%
                  </span>
                </div>
              </div>
              <button
                onClick={() => setDeleteId(r.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-[#e9e9e7] text-[#9b9a97] hover:text-red-500 transition-all"
                aria-label="Hapus"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Buat Roadmap */}
      {showModal && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(loading ? true : false)}
        >
          <h2 className="text-lg font-semibold text-[#37352f] mb-4">
            Buat Roadmap Baru
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[#9b9a97] uppercase tracking-wide">
                Topik
              </label>
              <input
                type="text"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="Misal: Web Development"
                className="mt-1 w-full px-3 py-2 text-sm border border-[#e9e9e7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#37352f]/20 focus:border-[#37352f]/40"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#9b9a97] uppercase tracking-wide">
                Durasi (hari)
              </label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="Misal: 30"
                min={1}
                className="mt-1 w-full px-3 py-2 text-sm border border-[#e9e9e7] rounded-md focus:outline-none focus:ring-1 focus:ring-[#37352f]/20 focus:border-[#37352f]/40"
              />
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !skill || !days}
              className="w-full py-2 text-sm bg-[#37352f] text-white rounded-md hover:bg-[#2f2d2a] transition-colors disabled:opacity-40"
            >
              {loading ? "Generating..." : "Generate Roadmap"}
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
            Hapus Roadmap?
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
