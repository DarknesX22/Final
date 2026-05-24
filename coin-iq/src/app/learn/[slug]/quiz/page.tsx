'use client';

import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import { CheckCircle, XCircle, Award, ChevronRight, RotateCcw } from 'lucide-react';
import type { Course } from '@/lib/lmsData';

interface QuizResult {
  score: number; passed: boolean; correct: number; total: number;
  certificateId: string | null;
  results: { id: number; selected: number; correct: number; isCorrect: boolean; explanation: string }[];
}

export default function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);

  useEffect(() => {
    fetch(`/api/learn/courses/${slug}`)
      .then(r => r.json())
      .then(d => { setCourse(d.course); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const select = (qId: number, optIdx: number) => {
    setAnswers(prev => ({ ...prev, [qId]: optIdx }));
  };

  const submit = async () => {
    if (!course) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/learn/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug: slug, answers }),
      });
      const d = await res.json();
      setResult(d);
    } catch (e: any) {
      alert('Failed to submit: ' + e.message);
    }
    setSubmitting(false);
  };

  const allAnswered = course ? Object.keys(answers).length === course.quiz.length : false;

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!course) return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <p className="text-gray-500">Course not found.</p>
    </div>
  );

  // ── Results screen ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="h-16" />
        <div className="max-w-2xl mx-auto px-4 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-gray-200 rounded-2xl p-8 text-center mb-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.passed ? 'bg-green-100' : 'bg-red-100'}`}>
              {result.passed
                ? <Award className="w-10 h-10 text-green-600" />
                : <XCircle className="w-10 h-10 text-red-500" />}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {result.passed ? '🎉 Congratulations!' : 'Keep Practicing'}
            </h1>
            <p className="text-gray-500 mb-6">
              {result.passed
                ? `You passed with ${result.score}%! Your certificate has been issued.`
                : `You scored ${result.score}%. You need 60% to pass. Try again!`}
            </p>
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="text-center">
                <p className="text-4xl font-black text-gray-900">{result.score}%</p>
                <p className="text-xs text-gray-400 mt-1">Score</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-black text-green-600">{result.correct}</p>
                <p className="text-xs text-gray-400 mt-1">Correct</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-black text-red-500">{result.total - result.correct}</p>
                <p className="text-xs text-gray-400 mt-1">Wrong</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {result.passed && result.certificateId && (
                <Link href={`/learn/certificate/${result.certificateId}`}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors">
                  <Award className="w-4 h-4" /> View Certificate
                </Link>
              )}
              {!result.passed && (
                <button onClick={() => { setResult(null); setAnswers({}); setCurrentQ(0); }}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors">
                  <RotateCcw className="w-4 h-4" /> Retry Quiz
                </button>
              )}
              <Link href={`/learn/${slug}`}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                Back to Course
              </Link>
            </div>
          </motion.div>

          {/* Answer review */}
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 text-lg">Answer Review</h2>
            {course.quiz.map((q, i) => {
              const r = result.results.find(x => x.id === q.id);
              return (
                <div key={q.id} className={`bg-white border-2 rounded-2xl p-5 ${r?.isCorrect ? 'border-green-200' : 'border-red-200'}`}>
                  <div className="flex items-start gap-3 mb-3">
                    {r?.isCorrect
                      ? <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      : <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
                    <p className="font-semibold text-gray-900 text-sm">{q.question}</p>
                  </div>
                  <div className="space-y-1.5 ml-8">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className={`px-3 py-2 rounded-lg text-sm ${
                        oi === q.correct ? 'bg-green-50 text-green-700 font-medium' :
                        oi === r?.selected && !r.isCorrect ? 'bg-red-50 text-red-600' :
                        'text-gray-500'
                      }`}>
                        {oi === q.correct && '✓ '}{opt}
                      </div>
                    ))}
                  </div>
                  <p className="ml-8 mt-3 text-xs text-gray-500 italic">{q.explanation}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Quiz screen ─────────────────────────────────────────────────────────────
  const q = course.quiz[currentQ];
  const answered = answers[q.id] !== undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="h-16" />
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href={`/learn/${slug}`} className="text-sm text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1">
            ← Back to course
          </Link>
          <span className="text-sm text-gray-500">{currentQ + 1} / {course.quiz.length}</span>
        </div>

        {/* Progress */}
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-8">
          <div className="h-1.5 bg-gray-900 rounded-full transition-all"
            style={{ width: `${((currentQ + 1) / course.quiz.length) * 100}%` }} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={currentQ}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
            className="bg-white border border-gray-200 rounded-2xl p-8">

            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">Question {currentQ + 1}</p>
            <h2 className="text-xl font-bold text-gray-900 mb-6">{q.question}</h2>

            <div className="space-y-3">
              {q.options.map((opt, oi) => (
                <button key={oi} onClick={() => select(q.id, oi)}
                  className={`w-full text-left px-5 py-4 rounded-xl border-2 text-sm font-medium transition-all ${
                    answers[q.id] === oi
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 hover:border-gray-400 text-gray-700'
                  }`}>
                  <span className="mr-3 font-bold">{String.fromCharCode(65 + oi)}.</span>{opt}
                </button>
              ))}
            </div>

            <div className="flex justify-between mt-8">
              <button onClick={() => setCurrentQ(Math.max(0, currentQ - 1))} disabled={currentQ === 0}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors">
                Previous
              </button>

              {currentQ < course.quiz.length - 1 ? (
                <button onClick={() => setCurrentQ(currentQ + 1)} disabled={!answered}
                  className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-40 transition-colors">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={submit} disabled={!allAnswered || submitting}
                  className="flex items-center gap-2 px-6 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-40 transition-colors">
                  {submitting ? 'Submitting...' : 'Submit Quiz'}
                  <Award className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Question dots */}
        <div className="flex justify-center gap-2 mt-6">
          {course.quiz.map((q2, i) => (
            <button key={i} onClick={() => setCurrentQ(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentQ ? 'bg-gray-900 scale-125' :
                answers[q2.id] !== undefined ? 'bg-gray-400' : 'bg-gray-200'
              }`} />
          ))}
        </div>
      </div>
    </div>
  );
}
