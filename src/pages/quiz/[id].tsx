import { useEffect, useState } from "react";

import { ArrowLeft, RotateCcw } from "lucide-react";
import Link from "next/link";
import { quizRepository } from "@/repositories";
import type { Quiz } from "@/repositories/types";
import { useRouter } from "next/router";

type QuizState = "belum" | "sedang" | "selesai";

export default function QuizDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [notFound, setNotFound] = useState(false);

  const [state, setState] = useState<QuizState>("belum");
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (!id) return;
    quizRepository.getById(id as string).then((data) => {
      if (data) setQuiz(data);
      else setNotFound(true);
    });
  }, [id]);

  if (notFound) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-16 py-12">
        <p className="text-sm text-[#9b9a97]">Quiz tidak ditemukan.</p>
        <Link
          href="/quiz"
          className="text-sm text-[#37352f] underline mt-2 inline-block"
        >
          Kembali
        </Link>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="max-w-3xl mx-auto px-6 md:px-16 py-12 space-y-3">
        <div className="h-8 w-56 bg-[#f7f7f5] rounded animate-pulse" />
        <div className="mt-8 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-12 bg-[#f7f7f5] rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  const handleReset = () => {
    setCurrent(0);
    setSelected({});
    setRevealed(false);
    setState("sedang");
  };

  // ── Halaman start ────────────────────────────────────────────────────────────
  if (state === "belum") {
    return (
      <div className="max-w-xl mx-auto px-6 md:px-0 py-12">
        <Link
          href="/quiz"
          className="inline-flex items-center gap-1.5 text-xs text-[#9b9a97] hover:text-[#37352f] transition-colors mb-6"
        >
          <ArrowLeft size={13} />
          Quiz
        </Link>
        <div className="border border-[#e9e9e7] rounded-2xl p-8 text-center">
          <span className="text-5xl mb-4 block">🧪</span>
          <h1 className="text-2xl font-bold text-[#37352f] mb-2">
            {quiz.topik}
          </h1>
          <p className="text-sm text-[#9b9a97] mb-8">
            {quiz.jumlah} soal pilihan ganda
          </p>
          <button
            onClick={() => setState("sedang")}
            className="px-8 py-2.5 bg-[#37352f] text-white text-sm rounded-lg hover:bg-[#2f2d2a] transition-colors"
          >
            Mulai Quiz
          </button>
        </div>
      </div>
    );
  }

  // ── Halaman hasil ────────────────────────────────────────────────────────────
  if (state === "selesai") {
    const correct = quiz.questions.filter(
      (q) => selected[q.nomor] === q.jawaban,
    ).length;
    const pct = Math.round((correct / quiz.questions.length) * 100);

    const grade =
      pct >= 80
        ? { label: "Luar Biasa!", color: "#16a34a" }
        : pct >= 60
          ? { label: "Lumayan!", color: "#2563eb" }
          : pct >= 40
            ? { label: "Perlu Latihan", color: "#ca8a04" }
            : { label: "Ulangi Materi", color: "#dc2626" };

    return (
      <div className="max-w-xl mx-auto px-6 md:px-0 py-12">
        <div className="border border-[#e9e9e7] rounded-2xl p-8 text-center mb-6">
          <p className="text-5xl font-bold mb-2" style={{ color: grade.color }}>
            {pct}%
          </p>
          <p className="text-lg font-semibold text-[#37352f] mb-1">
            {grade.label}
          </p>
          <p className="text-sm text-[#9b9a97] mb-6">
            {correct} dari {quiz.questions.length} soal benar
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 text-sm border border-[#e9e9e7] rounded-lg text-[#37352f] hover:bg-[#f7f7f5] transition-colors"
            >
              <RotateCcw size={13} />
              Ulangi
            </button>
            <Link
              href="/quiz"
              className="px-4 py-2 text-sm bg-[#37352f] text-white rounded-lg hover:bg-[#2f2d2a] transition-colors"
            >
              Selesai
            </Link>
          </div>
        </div>

        {/* Review semua soal */}
        <div className="space-y-4">
          {quiz.questions.map((q) => {
            const isRight = selected[q.nomor] === q.jawaban;
            return (
              <div
                key={q.nomor}
                className={`border rounded-xl p-4 ${
                  isRight
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex gap-2 mb-3">
                  <span
                    className={`text-sm font-medium ${isRight ? "text-green-600" : "text-red-600"}`}
                  >
                    {isRight ? "✓" : "✗"} {q.nomor}.
                  </span>
                  <p className="text-sm text-[#37352f]">{q.pertanyaan}</p>
                </div>
                <div className="space-y-1 mb-3">
                  {q.pilihan.map((p) => {
                    const letter = p[0];
                    const isAnswer = letter === q.jawaban;
                    const isUserPick = letter === selected[q.nomor];
                    return (
                      <div
                        key={letter}
                        className={`px-3 py-1.5 rounded-md text-xs ${
                          isAnswer
                            ? "bg-green-100 text-green-700 font-medium"
                            : isUserPick && !isAnswer
                              ? "bg-red-100 text-red-700 line-through"
                              : "text-[#5b5a57]"
                        }`}
                      >
                        {p}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-[#5b5a57] bg-white/60 rounded-lg px-3 py-2">
                  💡 {q.penjelasan}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Soal aktif ───────────────────────────────────────────────────────────────
  const q = quiz.questions[current];
  const userAnswer = selected[q.nomor];
  const isLast = current === quiz.questions.length - 1;

  const handleSelect = (letter: string) => {
    if (revealed) return;
    setSelected((prev) => ({ ...prev, [q.nomor]: letter }));
  };

  const handleNext = () => {
    setRevealed(false);
    if (isLast) {
      setState("selesai");
    } else {
      setCurrent((p) => p + 1);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-6 md:px-0 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/quiz"
          className="inline-flex items-center gap-1.5 text-xs text-[#9b9a97] hover:text-[#37352f] transition-colors"
        >
          <ArrowLeft size={13} />
          Quiz
        </Link>
        <span className="text-xs text-[#9b9a97]">
          {current + 1} / {quiz.questions.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[#e9e9e7] rounded-full mb-8">
        <div
          className="h-full bg-[#37352f] rounded-full transition-all duration-300"
          style={{ width: `${((current + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>

      {/* Pertanyaan */}
      <p className="text-base font-medium text-[#37352f] mb-6 leading-relaxed">
        {q.nomor}. {q.pertanyaan}
      </p>

      {/* Pilihan */}
      <div className="space-y-2 mb-6">
        {q.pilihan.map((p) => {
          const letter = p[0];
          const isSelected = userAnswer === letter;
          const isCorrect = revealed && letter === q.jawaban;
          const isWrong = revealed && isSelected && letter !== q.jawaban;

          return (
            <button
              key={letter}
              onClick={() => handleSelect(letter)}
              disabled={revealed}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                isCorrect
                  ? "border-green-400 bg-green-50 text-green-700 font-medium"
                  : isWrong
                    ? "border-red-400 bg-red-50 text-red-600 line-through"
                    : isSelected
                      ? "border-[#37352f] bg-[#37352f]/5 text-[#37352f] font-medium"
                      : "border-[#e9e9e7] text-[#37352f] hover:border-[#37352f]/30 hover:bg-[#f7f7f5]"
              }`}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* Penjelasan */}
      {revealed && (
        <div className="bg-[#f7f7f5] rounded-xl px-4 py-3 mb-6 text-xs text-[#5b5a57] leading-relaxed">
          💡 {q.penjelasan}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {userAnswer && !revealed && (
          <button
            onClick={() => setRevealed(true)}
            className="flex-1 py-2.5 text-sm border border-[#e9e9e7] rounded-lg text-[#37352f] hover:bg-[#f7f7f5] transition-colors"
          >
            Lihat Jawaban
          </button>
        )}
        {(revealed || userAnswer) && (
          <button
            onClick={handleNext}
            className="flex-1 py-2.5 text-sm bg-[#37352f] text-white rounded-lg hover:bg-[#2f2d2a] transition-colors"
          >
            {isLast ? "Lihat Hasil" : "Soal Berikutnya →"}
          </button>
        )}
      </div>
    </div>
  );
}
