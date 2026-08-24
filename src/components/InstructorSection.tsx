import React from 'react';
import { FlagSkoolConfig } from '@/types/index';
import { Card } from './ui/Card';
import { Avatar } from './ui/Avatar';
import { ShieldAlert, Terminal, Award, BookCheck } from 'lucide-react';

export interface InstructorSectionProps {
  config: FlagSkoolConfig;
}

export const InstructorSection: React.FC<InstructorSectionProps> = ({ config }) => {
  return (
    <section
      id="instructor-section"
      className="py-16 sm:py-24 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-ink-border/60"
    >
      <div className="text-center max-w-3xl mx-auto mb-12">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-text block mb-2">
          Practitioner-Led Instruction
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-paper-soft tracking-tight mb-3">
          Taught by Engineers Shipping in Production
        </h2>
      </div>

      <Card className="border-ink-border p-8 sm:p-10">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Photo Placeholder */}
          <div className="flex flex-col items-center shrink-0">
            <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl bg-ink-deep border-2 border-ink-border flex flex-col items-center justify-center p-4 relative overflow-hidden shadow-inner group">
              <Avatar
                name={config.org.instructorName}
                size="xl"
                className="w-24 h-24 sm:w-28 sm:h-28 text-2xl font-bold border-2 border-flag-red"
              />
              <span className="mt-2 text-[11px] font-mono text-muted-text text-center">
                Photo Placeholder
              </span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-[#059669] font-medium">
              <Award className="w-3.5 h-3.5" />
              Verified Instructor
            </div>
          </div>

          {/* Bio Content & TODO Handoff */}
          <div className="flex-1 text-center md:text-left">
            <div className="mb-4">
              <h3 className="font-display text-2xl sm:text-3xl font-bold text-paper-soft">
                {config.org.instructorName}
              </h3>
              <p className="text-[15px] font-mono text-flag-red font-semibold mt-0.5">
                Lead AI Systems Architect & Founder, Flag Skool
              </p>
            </div>

            {/* Two-Paragraph Bio Slot with TODO(handoff) */}
            <div className="space-y-4 text-[16px] text-body-text leading-relaxed mb-6">
              {config.copy.instructorBioParagraphs.map((para, idx) => (
                <p
                  key={idx}
                  className={
                    para.includes('TODO(handoff)')
                      ? 'font-mono text-xs text-muted-text bg-ink-deep p-2.5 rounded border border-ink-border'
                      : 'text-body-text'
                  }
                >
                  {para}
                </p>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-ink-border text-[14px] text-muted-text">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-flag-red" />
                <span>Production AI & Agent Specialist</span>
              </div>
              <div className="flex items-center gap-2">
                <BookCheck className="w-4 h-4 text-[#059669]" />
                <span>750+ Nigerian Engineers Mentored</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
};
