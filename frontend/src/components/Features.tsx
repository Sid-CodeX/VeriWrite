
import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { FileText, Globe, Lock, BarChart4, Search, Zap } from 'lucide-react';
import GlassmorphismCard from './ui/GlassmorphismCard';

const Features = () => {
  const featuresRef = useRef<HTMLDivElement>(null);

  // Simple intersection observer to trigger animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-slide-up');
            entry.target.classList.remove('opacity-0');
          }
        });
      },
      { threshold: 0.1 }
    );

    const features = document.querySelectorAll('.feature-card');
    features.forEach((feature) => {
      observer.observe(feature);
    });

    return () => {
      features.forEach((feature) => {
        observer.unobserve(feature);
      });
    };
  }, []);

  const features = [
    {
      icon: <FileText className="text-veri" size={32} />,
      title: "Document Upload & Analysis",
      description:
        "Upload documents and get comprehensive plagiarism reports. Supports all major file formats for thorough analysis."
    },
    {
      icon: <Globe className="text-veri" size={32} />,
      title: "Online Source Comparison",
      description:
        "Compare submissions against billions of web pages, academic journals, and publications for comprehensive detection."
    },
    {
      icon: <Lock className="text-veri" size={32} />,
      title: "Secure & Private",
      description:
        "All uploads are encrypted and processed securely. Your documents remain private and protected at all times."
    },
    {
      icon: <BarChart4 className="text-veri" size={32} />,
      title: "Detailed Reports",
      description:
        "Receive comprehensive reports with similarity scores, source highlights, and actionable insights."
    },
    {
      icon: <Search className="text-veri" size={32} />,
      title: "Advanced Detection",
      description:
        "Our algorithms detect even sophisticated attempts at plagiarism, including paraphrasing and text manipulation."
    },
    {
      icon: <Zap className="text-veri" size={32} />,
      title: "Fast Processing",
      description:
        "Get results quickly with our optimized processing engine. Large documents are analyzed in seconds."
    }
  ];

  return (
    <section ref={featuresRef} className="py-24 px-6 bg-gradient-to-b from-secondary/20 to-background">
      <div className="container max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Comprehensive Plagiarism Detection
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            VeriWrite provides educators with powerful tools to maintain academic integrity
            and promote original thinking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={cn(
                "feature-card opacity-0 transition-all duration-500",
              )}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <GlassmorphismCard
                className="h-full p-6"
                intensity="light"
              >
                <div className="flex flex-col h-full">
                  <div className="mb-4 p-3 rounded-full bg-veri/10 w-fit">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm flex-grow">
                    {feature.description}
                  </p>
                </div>
              </GlassmorphismCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
