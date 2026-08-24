import React from 'react';
import { clsx } from 'clsx';
import { ChevronDown } from 'lucide-react';

export interface AccordionItemData {
  id: string;
  trigger: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface AccordionProps {
  items: AccordionItemData[];
  openIds: string[];
  onToggle: (id: string) => void;
  allowMultiple?: boolean;
  className?: string;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  openIds,
  onToggle,
  className,
}) => {
  return (
    <div className={clsx('divide-y divide-ink-border border-y border-ink-border', className)}>
      {items.map((item) => {
        const isOpen = openIds.includes(item.id);

        return (
          <div key={item.id} className="group transition-colors">
            <button
              type="button"
              id={`accordion-trigger-${item.id}`}
              aria-expanded={isOpen}
              aria-controls={`accordion-content-${item.id}`}
              disabled={item.disabled}
              onClick={() => !item.disabled && onToggle(item.id)}
              className={clsx(
                'w-full py-5 sm:py-6 flex items-center justify-between text-left transition-colors min-h-[48px] focus:outline-none focus-visible:ring-2 focus-visible:ring-flag-red rounded-md',
                item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:text-paper-soft'
              )}
            >
              <div className="flex-1 pr-4">{item.trigger}</div>
              <div
                className={clsx(
                  'w-8 h-8 rounded-full bg-ink-raised border border-ink-border flex items-center justify-center shrink-0 transition-transform duration-200 ease-out',
                  isOpen ? 'rotate-180 border-flag-red/40 text-paper-soft' : 'text-muted-text'
                )}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            {isOpen && (
              <div
                id={`accordion-content-${item.id}`}
                role="region"
                aria-labelledby={`accordion-trigger-${item.id}`}
                className="pb-6 pt-1 text-body-text transition-opacity duration-200"
              >
                {item.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
