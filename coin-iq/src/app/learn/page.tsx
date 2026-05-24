'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import { BookOpen, Clock, Award, ChevronRight, CheckCircle, Lock } from 'lucide-react';

interface CourseCard {
  slug: string; title: string; description: string;
  level: string; durationMinutes: number; icon: string;
  color: string; lessonCount: number; quizCount: number;
  progress: { completed_lessons: number[]; quiz_passed: boolean; completed: boolean; quiz_score: number } | null;
}

const LEVEL_STYLE: Record<string, string> = {
  Beginner:     'bg-green-50 text-green-700 border-green-200',
  Intermediate: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Advanced:     'bg-red-50 text-red-700 border-red-200',
};

export default function LearnPage() {
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/learn/courses')
      .then(r => r.json())
      .then(d => { setCourses(d.courses ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const completed = courses.filter(c => c.progress?.completed).length;

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      <div className="h-16" />

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 border border-gray-200 mb-5">
              <BookOpen className="w-3.5 h-3.5 text-gray-600" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-widest">Learning Hub</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Crypto Education</h1>
            <p className="text-gray-500 text-base max-w-xl">
              Master blockchain, DeFi, NFTs and trading — earn certificates as you go.
            </p>
            {completed > 0 && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
                <Award className="w-4 h-4" />
                {completed} of {courses.length} courses completed
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Course grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-56 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course, i) => {
              const done = course.progress?.completed ?? false;
              const lessonsCompleted = course.progress?.completed_lessons?.length ?? 0;
              const pct = Math.round((lessonsCompleted / course.lessonCount) * 100);

              return (
                <motion.div key={course.slug}
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}>
                  <Link href={`/learn/${course.slug}`}>
                    <div className={`group border-2 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col ${course.color} ${done ? 'border-green-400' : ''}`}>
                      <div className="flex items-start justify-between mb-4">
                        <span className="text-4xl">{course.icon}</span>
                        <div className="flex items-center gap-2">
                          {done && <CheckCircle className="w-5 h-5 text-green-600" />}
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${LEVEL_STYLE[course.level] ?? 'bg-gray-100 text-gray-600'}`}>
                            {course.level}
                          </span>
                        </div>
                      </div>

                      <h2 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h2>
                      <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-4">{course.description}</p>

                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{course.lessonCount} lessons</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{course.durationMinutes} min</span>
                        <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />Certificate</span>
                      </div>

                      {/* Progress bar */}
                      {lessonsCompleted > 0 && (
                        <div className="mb-4">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>{lessonsCompleted}/{course.lessonCount} lessons</span>
                            <span>{pct}%</span>
                          </div>
                          <div className="w-full bg-white/60 rounded-full h-1.5">
                            <div className="h-1.5 bg-gray-900 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-900">
                          {done ? '✅ Completed' : lessonsCompleted > 0 ? 'Continue' : 'Start Course'}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-500 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
