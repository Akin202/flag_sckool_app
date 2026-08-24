import React, { useState, useEffect } from 'react';
import { Module } from '@/types/index';
import { getModulesWithLessons } from '@/lib/data-access';
import { Accordion } from './ui/Accordion';
import { Badge } from './ui/Badge';
import { Skeleton } from './ui/Skeleton';
import { Clock, PlayCircle, BookOpen, Layers } from 'lucide-react';

export interface CurriculumSectionProps {
  onSelectFreeLesson?: (lessonId: string) => void;
}

export const CurriculumSection: React.FC<CurriculumSectionProps> = ({
  onSelectFreeLesson,
}) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  // Default first module (or Module 1) open for immediate engagement
  const [openIds, setOpenIds] = useState<string[]>(['mod-1']);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getModulesWithLessons()
      .then((data) => {
        if (isMounted) {
          setModules(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleToggle = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const formatHoursAndMins = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const totalCurriculumMinutes = modules.reduce(
    (acc, mod) => acc + mod.totalDurationMinutes,
    0
  );
  const totalLessons = modules.reduce(
    (acc, mod) => acc + mod.lessonCount,
    0
  );

  const accordionItems = modules.map((mod) => ({
    id: mod.id,
    trigger: (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-9 h-9 rounded-md bg-ink-border border border-[#2D3A63]/60 flex items-center justify-center font-mono text-sm font-bold text-paper-soft shrink-0">
            0{mod.number}
          </div>
          <div>
            <h3 className="font-display text-lg sm:text-xl font-bold text-paper-soft group-hover:text-paper-soft transition-colors leading-snug">
              {mod.title}
            </h3>
            {mod.description && (
              <p className="text-[14px] text-muted-text line-clamp-1 mt-0.5">
                {mod.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-[13px] sm:text-[14px] font-mono text-muted-text pl-12 sm:pl-0 shrink-0">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            {mod.lessonCount} lessons
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {formatHoursAndMins(mod.totalDurationMinutes)}
          </span>
        </div>
      </div>
    ),
    content: (
      <div className="pl-0 sm:pl-12 pt-2 space-y-3">
        {mod.lessons.map((lesson, lIdx) => (
          <div
            key={lesson.id}
            id={`lesson-row-${lesson.id}`}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-lg bg-ink-deep border border-ink-border hover:border-[#2D3A63] transition-colors gap-2 sm:gap-4"
          >
            <div className="flex items-start sm:items-center gap-3">
              <PlayCircle className="w-4 h-4 text-muted-text mt-1 sm:mt-0 shrink-0" />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-muted-text">
                    0{mod.number}.{lIdx + 1}
                  </span>
                  <span className="text-[15px] sm:text-[16px] font-medium text-paper-soft">
                    {lesson.title}
                  </span>
                  {lesson.isFree && (
                    <Badge variant="accent" size="sm">
                      Free
                    </Badge>
                  )}
                </div>
                {lesson.description && (
                  <p className="text-[13px] text-muted-text mt-1 max-w-2xl">
                    {lesson.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 pl-7 sm:pl-0 shrink-0">
              <span className="font-mono text-[13px] text-muted-text flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {lesson.durationMinutes}m
              </span>
              {lesson.isFree && onSelectFreeLesson && (
                <button
                  type="button"
                  onClick={() => onSelectFreeLesson(lesson.id)}
                  className="text-[13px] font-medium text-flag-red hover:underline focus:outline-none"
                >
                  Watch stream →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    ),
  }));

  return (
    <section
      id="curriculum-section"
      className="py-16 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-ink-border/60"
    >
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-text block mb-2">
          In-Depth Engineering Syllabus
        </span>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-paper-soft tracking-tight mb-4">
          Complete Modular Curriculum
        </h2>
        <p className="text-lg text-muted-text mb-6">
          Over {formatHoursAndMins(totalCurriculumMinutes || 540)} of rigorous technical instruction, architectural blueprints, live coding walk-throughs, and deployable repositories.
        </p>

        <div className="inline-flex items-center gap-4 px-4 py-2 rounded-lg bg-ink-raised border border-ink-border font-mono text-[14px] text-body-text">
          <span className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-flag-red" />
            {modules.length || 6} Modules
          </span>
          <span className="text-[#2D3A63]">•</span>
          <span>{totalLessons || 14} In-Depth Lessons</span>
          <span className="text-[#2D3A63]">•</span>
          <span>{formatHoursAndMins(totalCurriculumMinutes || 540)} Total Runtime</span>
        </div>
      </div>

      {/* Controlled Accordion or Skeletons */}
      <div className="bg-ink-raised rounded-2xl border border-ink-border p-4 sm:p-8 shadow-xl">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton height={56} width="100%" />
            <Skeleton height={56} width="100%" />
            <Skeleton height={56} width="100%" />
          </div>
        ) : (
          <Accordion
            items={accordionItems}
            openIds={openIds}
            onToggle={handleToggle}
          />
        )}
      </div>
    </section>
  );
};
