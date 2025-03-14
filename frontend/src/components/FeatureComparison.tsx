
import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureItem {
  feature: string;
  veriWrite: boolean;
  competitors: boolean;
  highlight?: boolean;
}

const features: FeatureItem[] = [
  {
    feature: 'Text-based plagiarism detection',
    veriWrite: true,
    competitors: true,
  },
  {
    feature: 'Handwritten document scanning',
    veriWrite: true,
    competitors: false,
    highlight: true,
  },
  {
    feature: 'Semantic analysis for paraphrased content',
    veriWrite: true,
    competitors: false,
    highlight: true,
  },
  {
    feature: 'Cross-language plagiarism detection',
    veriWrite: true,
    competitors: false,
    highlight: true,
  },
  {
    feature: 'Source tracking & citation assistance',
    veriWrite: true,
    competitors: true,
  },
  {
    feature: 'Classroom integration',
    veriWrite: true,
    competitors: true,
  },
  {
    feature: 'AI writing detection',
    veriWrite: true,
    competitors: false,
    highlight: true,
  },
];

const FeatureComparison: React.FC = () => {
  const [visibleFeatures, setVisibleFeatures] = useState<number[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setVisibleFeatures((prev) => [...prev, index]);
          }
        });
      },
      { threshold: 0.1 }
    );

    const rows = document.querySelectorAll('.feature-row');
    rows.forEach((row) => observer.observe(row));

    return () => {
      rows.forEach((row) => observer.unobserve(row));
    };
  }, []);

  return (
    <div className="overflow-hidden rounded-xl shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-secondary/70">
              <th className="py-5 px-6 text-left font-semibold">Feature</th>
              <th className="py-5 px-6 text-center font-semibold">
                <span className="flex items-center justify-center gap-2">
                  <span className="text-veri">Veri</span>
                  <span className="text-write">Write</span>
                </span>
              </th>
              <th className="py-5 px-6 text-center font-semibold">Competitors</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {features.map((item, index) => (
              <tr 
                key={index} 
                className={cn(
                  index % 2 === 0 ? 'bg-background' : 'bg-secondary/30',
                  item.highlight && 'relative overflow-hidden',
                  'feature-row transition-all duration-500'
                )}
                data-index={index}
              >
                {item.highlight && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-veri" />
                )}
                <td className={cn(
                  "py-4 px-6",
                  item.highlight && "font-medium",
                  visibleFeatures.includes(index) ? "animate-slide-in" : "opacity-0 -translate-x-4"
                )}
                style={{ animationDelay: `${0.1 * index}s` }}
                >
                  {item.feature}
                </td>
                <td className={cn(
                  "py-4 px-6 text-center",
                  visibleFeatures.includes(index) ? "animate-fade-in" : "opacity-0"
                )}
                style={{ animationDelay: `${0.2 + 0.1 * index}s` }}
                >
                  {item.veriWrite ? (
                    <div className="flex justify-center">
                      <span className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Check className="w-5 h-5 text-green-500" />
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <span className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <X className="w-5 h-5 text-red-500" />
                      </span>
                    </div>
                  )}
                </td>
                <td className={cn(
                  "py-4 px-6 text-center",
                  visibleFeatures.includes(index) ? "animate-fade-in" : "opacity-0"
                )}
                style={{ animationDelay: `${0.3 + 0.1 * index}s` }}
                >
                  {item.competitors ? (
                    <div className="flex justify-center">
                      <span className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <Check className="w-5 h-5 text-green-500" />
                      </span>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <span className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <X className="w-5 h-5 text-red-500" />
                      </span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FeatureComparison;
