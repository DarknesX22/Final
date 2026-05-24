'use client';

import { useState, useEffect, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar';
import { BookOpen, ChevronLeft, ChevronRight, CheckCircle, Award, Clock, ArrowRight } from 'lucide-react';
import type { Course } from '@/lib/lmsData';

interface Progress {
  completed_lessons: number[];
  quiz_passed: boolean;
  completed: boolean;
  quiz_score: number;
}

export default function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [activeLesson, setActiveLesson] = useState(0);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    fetch(`/api/learn/courses/${slug}`)
      .then(r => r.json())
      .then(d => {
        setCourse(d.course);
        setProgress(d.progress);
        // Resume from last lesson
        if (d.progress?.lesson_index) setActiveLesson(d.progress.lesson_index);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const markComplete = async (lessonIndex: number) => {
    setMarking(true);
    try {
      const res = await fetch('/api/learn/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug: slug, lessonIndex }),
      });
      const d = await res.json();
      if (d.progress) setProgress(d.progress);
    } catch { /* not logged in */ }
    setMarking(false);
  };

  const isCompleted = (idx: number) => progress?.completed_lessons?.includes(idx) ?? false;
  const allLessonsCompleted = course ? course.lessons.every((_, i) => isCompleted(i)) : false;

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

  const lesson = course.lessons[activeLesson];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="h-16" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/learn" className="hover:text-gray-900 transition-colors">Learning Hub</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium">{course.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-24">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{course.icon}</span>
                <h2 className="font-bold text-gray-900 text-sm">{course.title}</h2>
              </div>
              <p className="text-xs text-gray-400 mb-4 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {course.durationMinutes} min · {course.lessons.length} lessons
              </p>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{progress?.completed_lessons?.length ?? 0}/{course.lessons.length}</span>
                  <span>{Math.round(((progress?.completed_lessons?.length ?? 0) / course.lessons.length) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 bg-gray-900 rounded-full transition-all"
                    style={{ width: `${((progress?.completed_lessons?.length ?? 0) / course.lessons.length) * 100}%` }} />
                </div>
              </div>

              {/* Lesson list */}
              <div className="space-y-1">
                {course.lessons.map((l, i) => (
                  <button key={i} onClick={() => setActiveLesson(i)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 ${
                      activeLesson === i ? 'bg-gray-900 text-white' : 'hover:bg-gray-50 text-gray-700'
                    }`}>
                    {isCompleted(i)
                      ? <CheckCircle className={`w-4 h-4 shrink-0 ${activeLesson === i ? 'text-green-400' : 'text-green-500'}`} />
                      : <span className={`w-4 h-4 rounded-full border-2 shrink-0 ${activeLesson === i ? 'border-white' : 'border-gray-300'}`} />
                    }
                    <span className="truncate">{l.title}</span>
                  </button>
                ))}

                {/* Quiz button */}
                <button
                  onClick={() => allLessonsCompleted && router.push(`/learn/${slug}/quiz`)}
                  disabled={!allLessonsCompleted}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 mt-2 ${
                    allLessonsCompleted
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}>
                  <Award className="w-4 h-4 shrink-0" />
                  {progress?.quiz_passed ? '✅ Quiz Passed' : 'Take Quiz'}
                </button>
              </div>
            </div>
          </div>

          {/* Lesson content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div key={activeLesson}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}
                className="bg-white border border-gray-200 rounded-2xl p-8">

                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Lesson {activeLesson + 1} of {course.lessons.length}</p>
                    <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
                  </div>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {lesson.duration} min
                  </span>
                </div>

                {/* Render lesson content */}
                <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
                  {lesson.content.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-gray-900 mt-6 mb-3">{line.slice(3)}</h2>;
                    if (line.startsWith('### ')) return <h3 key={i} className="text-base font-bold text-gray-800 mt-4 mb-2">{line.slice(4)}</h3>;
                    if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-gray-900 mt-3">{line.slice(2, -2)}</p>;
                    if (line.startsWith('- ')) return <li key={i} className="ml-4 text-gray-600 text-sm">{line.slice(2)}</li>;
                    if (line.startsWith('| ')) return null; // skip table lines for simplicity
                    if (line.trim() === '') return <div key={i} className="h-2" />;
                    return <p key={i} className="text-gray-600 text-sm leading-relaxed">{line}</p>;
                  })}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-100">
                  <button onClick={() => setActiveLesson(Math.max(0, activeLesson - 1))}
                    disabled={activeLesson === 0}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  <div className="flex items-center gap-3">
                    {!isCompleted(activeLesson) && (
                      <button onClick={() => markComplete(activeLesson)} disabled={marking}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors">
                        <CheckCircle className="w-4 h-4" />
                        {marking ? 'Saving...' : 'Mark Complete'}
                      </button>
                    )}

                    {activeLesson < course.lessons.length - 1 ? (
                      <button onClick={() => { markComplete(activeLesson); setActiveLesson(activeLesson + 1); }}
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
                        Next <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : allLessonsCompleted ? (
                      <Link href={`/learn/${slug}/quiz`}
                        className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors">
                        Take Quiz <Award className="w-4 h-4" />
                      </Link>
                    ) : (
                      <button onClick={() => markComplete(activeLesson)} disabled={marking || isCompleted(activeLesson)}
                        className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors">
                        Finish Course <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
