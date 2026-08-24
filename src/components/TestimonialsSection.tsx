import React from 'react';
import { Testimonial, TestimonialsState } from '@/types/index';
import { MOCK_TESTIMONIALS } from '@/lib/mock-data';
import { Card } from './ui/Card';
import { Avatar } from './ui/Avatar';
import { EmptyState } from './ui/EmptyState';
import { MessageSquare, Star, Quote } from 'lucide-react';

export interface TestimonialsSectionProps {
  testimonialsState: TestimonialsState;
  onShareStoryClick?: () => void;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({
  testimonialsState,
  onShareStoryClick,
}) => {
  const isPopulated = testimonialsState === 'populated';

  return (
    <section
      id="testimonials-section"
      className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#1A2342]/60"
    >
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <span className="font-mono text-xs uppercase tracking-widest text-[#8492A6] block mb-2">
          Real Alumni Outcomes
        </span>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F8FAFC] tracking-tight mb-4">
          Built and Shipped by Our Students
        </h2>
        <p className="text-lg text-[#8492A6]">
          Hear how engineers across Lagos, Abuja, Ibadan, and remote African tech ecosystems apply Flag Skool blueprints in production.
        </p>
      </div>

      {isPopulated ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {MOCK_TESTIMONIALS.map((t) => (
            <Card
              key={t.id}
              id={`testimonial-card-${t.id}`}
              className="flex flex-col justify-between border-[#1A2342] hover:border-[#2D3A63] transition-colors relative"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-[#F59E0B]">
                    {[...Array(t.rating || 5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="font-mono text-xs text-[#8492A6]">
                    {t.cohort}
                  </span>
                </div>

                <Quote className="w-8 h-8 text-[#1A2342] mb-3" />
                <p className="text-[16px] text-[#CBD5E1] leading-relaxed italic mb-6">
                  "{t.quote}"
                </p>
              </div>

              <div className="flex items-center gap-3.5 pt-4 border-t border-[#1A2342]">
                <Avatar name={t.name} initials={t.initials} size="md" />
                <div>
                  <h3 className="text-[15px] font-bold text-[#F8FAFC] leading-snug">
                    {t.name}
                  </h3>
                  <p className="text-[13px] text-[#8492A6] leading-tight">
                    {t.role}
                  </p>
                  {t.company && (
                    <p className="text-[12px] text-[#8492A6]/80">{t.company}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <EmptyState
          icon={<MessageSquare className="w-6 h-6 text-[#8492A6]" />}
          headline="Testimonials being gathered for Cohort 2"
          body="Real verified student testimonials and project showcases are actively being curated from our Cohort 1 graduates. Check back soon or preview Lesson 1 above."
          actionLabel="Submit your project story"
          onAction={onShareStoryClick}
          className="max-w-2xl mx-auto"
        />
      )}
    </section>
  );
};
