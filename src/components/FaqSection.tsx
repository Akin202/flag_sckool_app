import React, { useState } from 'react';
import { Accordion } from './ui/Accordion';
import { HelpCircle, Mail } from 'lucide-react';
import { FAQItem, FlagSkoolConfig } from '@/types/index';

export interface FaqSectionProps {
  config: FlagSkoolConfig;
  faqs: FAQItem[];
}

export const FaqSection: React.FC<FaqSectionProps> = ({ config, faqs }) => {
  // First FAQ open by default
  const [openIds, setOpenIds] = useState<string[]>(['faq-1']);

  const handleToggle = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const accordionItems = faqs.map((faq) => ({
    id: faq.id,
    trigger: (
      <div className="flex items-center gap-3">
        <h3 className="font-display text-lg sm:text-xl font-bold text-paper-soft group-hover:text-paper-soft leading-snug">
          {faq.question}
        </h3>
      </div>
    ),
    content: (
      <p className="text-[16px] text-body-text leading-relaxed max-w-3xl pt-1">
        {faq.answer}
      </p>
    ),
  }));

  return (
    <section
      id="faq-section"
      className="py-16 sm:py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-ink-border/60"
    >
      <div className="text-center mb-10 sm:mb-14">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-text block mb-2">
          Clear Answers
        </span>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-paper-soft tracking-tight mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-lg text-muted-text">
          Everything you need to know about course access, bandwidth considerations, and curriculum expectations.
        </p>
      </div>

      <div className="bg-ink-raised rounded-2xl border border-ink-border p-4 sm:p-8 shadow-xl">
        <Accordion
          items={accordionItems}
          openIds={openIds}
          onToggle={handleToggle}
        />
      </div>

      <div className="mt-8 text-center text-[15px] text-muted-text">
        Have a specific question not listed here?{' '}
        <a
          href={`mailto:${config.org.supportEmail}`}
          className="text-flag-red hover:underline font-medium inline-flex items-center gap-1"
        >
          <Mail className="w-3.5 h-3.5" /> Email our admissions desk
        </a>
      </div>
    </section>
  );
};
