import React from 'react';
import { FlagSkoolConfig } from '@/types/index';
import { Card } from './ui/Card';
import { Bot, Workflow, Rocket } from 'lucide-react';

export interface OutcomesSectionProps {
  config: FlagSkoolConfig;
}

export const OutcomesSection: React.FC<OutcomesSectionProps> = ({ config }) => {
  const getIcon = (iconName: 'bot' | 'workflow' | 'rocket') => {
    switch (iconName) {
      case 'bot':
        return <Bot className="w-6 h-6 text-flag-red" />;
      case 'workflow':
        return <Workflow className="w-6 h-6 text-flag-red" />;
      case 'rocket':
        return <Rocket className="w-6 h-6 text-flag-red" />;
      default:
        return <Bot className="w-6 h-6 text-flag-red" />;
    }
  };

  return (
    <section
      id="outcomes-section"
      className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-ink-border/60"
    >
      <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-text block mb-2">
          Concrete Skills & Production Outputs
        </span>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-paper-soft tracking-tight mb-4">
          What You Will Actually Build and Ship
        </h2>
        <p className="text-lg text-muted-text">
          No superficial chatbot prompts or generic slides. You walk away with fully functioning codebases, self-healing automations, and live production endpoints.
        </p>
      </div>

      {/* 3-Column Grid on Desktop, Single Column on Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {config.copy.outcomeBullets.map((bullet, idx) => (
          <Card
            key={bullet.id}
            id={`outcome-card-${bullet.id}`}
            className="flex flex-col justify-between hover:border-[#2D3A63] transition-colors"
          >
            <div>
              <div className="w-12 h-12 rounded-lg bg-ink-border/80 border border-[#2D3A63]/60 flex items-center justify-center mb-6">
                {getIcon(bullet.iconName)}
              </div>
              <span className="font-mono text-xs font-bold text-muted-text uppercase tracking-wider block mb-1">
                Capability 0{idx + 1}
              </span>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-paper-soft mb-3 leading-snug">
                {bullet.title}
              </h3>
              <p className="text-[16px] text-body-text leading-relaxed">
                {bullet.description}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};
