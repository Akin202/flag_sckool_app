import React, { useState } from 'react';
import { MOCK_FAQS } from '@/lib/mock-data';
import { Accordion } from './ui/Accordion';
import { HelpCircle, Mail } from 'lucide-react';
import { FlagSkoolConfig } from '@/types/index';

export interface FaqSectionProps {
  config: FlagSkoolConfig;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ config }) => {
  // First FAQ open by default
  const [openIds, setOpenIds] = useState<string[]>(['faq-1']);

  const handleToggle = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const accordionItems = MOCK_FAQS.map((faq) => ({
    id: faq.id,
    trigger: (
      <div className="flex items-center gap-3">
        <h3 className="font-display text-lg sm:text-xl font-bold text-[#F8FAFC] group-hover:text-[#F8FAFC] leading-snug">
          {faq.question}
        </h3>
      </div>
    ),
    content: (
      <p className="text-[16px] text-[#CBD5E1] leading-relaxed max-w-3xl pt-1">
        {faq.answer}
      </p>
    ),
  }));

  return (
    <section
      id="faq-section"
      className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#1A2342]/60"
    >
      <div className="text-center mb-10 sm:mb-14">
        <span className="font-mono text-xs uppercase tracking-widest text-[#8492A6] block mb-2">
          Clear Answers
        </span>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F8FAFC] tracking-tight mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-lg text-[#8492A6]">
          Everything you need to know about course access, bandwidth considerations, and curriculum expectations.
        </p>
      </div>

      <div className="bg-[#0A0F29] rounded-2xl border border-[#1A2342] p-4 sm:p-8 shadow-xl">
        <Accordion
          items={accordionItems}
          openIds={openIds}
          onToggle={handleToggle}
        />
      </div>

      <div className="mt-8 text-center text-[15px] text-[#8492A6]">
        Have a specific question not listed here?{' '}
        <a
          href={`mailto:${config.org.supportEmail}`}
          className="text-[#CA3A32] hover:underline font-medium inline-flex items-center gap-1"
        >
          <Mail className="w-3.5 h-3.5" /> Email our admissions desk
        </a>
      </div>
    </section>
  );
};
