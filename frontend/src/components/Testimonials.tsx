
import React, { useState, useEffect } from 'react';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
}

const testimonials: Testimonial[] = [
  {
    quote: "VeriWrite has revolutionized how we handle academic integrity at our university. The handwritten document scanning is a game-changer.",
    author: "Dr. Sarah Johnson",
    role: "Department Chair, Stanford University"
  },
  {
    quote: "The accuracy of VeriWrite's plagiarism detection is unmatched. It catches subtle instances that other tools miss completely.",
    author: "Prof. Michael Chen",
    role: "Computer Science, MIT"
  },
  {
    quote: "My students appreciate the clear reports and learning opportunities that VeriWrite provides. It's not just about catching plagiarism, but teaching proper citation.",
    author: "Dr. Emily Rodriguez",
    role: "English Department, UC Berkeley"
  },
  {
    quote: "The ability to scan handwritten documents has transformed our examination process. We can now verify originality in both digital and physical submissions.",
    author: "Prof. David Thompson",
    role: "History Department, Yale University"
  },
  {
    quote: "As an administrator, I appreciate the detailed analytics that help us identify trends and address systemic issues in academic integrity.",
    author: "Dr. Lisa Wang",
    role: "Academic Integrity Office, Princeton University"
  }
];

const Testimonials: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  
  // Auto-advance testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [activeIndex]);

  const handlePrev = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setDirection('left');
    
    setTimeout(() => {
      setActiveIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1));
      setIsAnimating(false);
    }, 300);
  };

  const handleNext = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setDirection('right');
    
    setTimeout(() => {
      setActiveIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1));
      setIsAnimating(false);
    }, 300);
  };

  const displayTestimonials = () => {
    // For mobile, show one testimonial with navigation buttons
    return (
      <div className="relative overflow-hidden">
        <div 
          className={cn(
            "transition-all duration-300 ease-in-out",
            isAnimating && direction === 'right' && "opacity-0 translate-x-10",
            isAnimating && direction === 'left' && "opacity-0 -translate-x-10"
          )}
        >
          <div className="glass-card p-8 rounded-xl relative">
            <div className="absolute -top-4 -left-4 w-10 h-10 bg-veri rounded-full flex items-center justify-center shadow-lg">
              <Quote className="w-5 h-5 text-white" />
            </div>
            <p className="italic text-muted-foreground mb-6 leading-relaxed text-lg">"{testimonials[activeIndex].quote}"</p>
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-veri font-bold text-xl mr-4">
                {testimonials[activeIndex].author.charAt(0)}
              </div>
              <div>
                <p className="font-semibold">{testimonials[activeIndex].author}</p>
                <p className="text-sm text-muted-foreground">{testimonials[activeIndex].role}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-center items-center mt-8 gap-4">
          <button 
            onClick={handlePrev}
            className="p-2 rounded-full bg-secondary/50 hover:bg-secondary transition-colors"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {/* Dots */}
          <div className="flex gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index < activeIndex ? 'left' : 'right');
                  setActiveIndex(index);
                }}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  index === activeIndex ? "bg-veri w-4" : "bg-secondary"
                )}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
          
          <button 
            onClick={handleNext}
            className="p-2 rounded-full bg-secondary/50 hover:bg-secondary transition-colors"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16 opacity-0 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">What Educators Are <span className="text-veri">Saying</span></h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            VeriWrite is trusted by educators at leading institutions around the world.
          </p>
        </div>
        
        <div className="md:hidden">
          {displayTestimonials()}
        </div>
        
        <div className="hidden md:grid md:grid-cols-3 gap-8">
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <div 
              key={index} 
              className="glass-card p-8 rounded-xl relative opacity-0 animate-fade-in"
              style={{ animationDelay: `${0.2 + index * 0.1}s`, animationFillMode: 'forwards' }}
            >
              <div className="absolute -top-4 -left-4 w-10 h-10 bg-veri rounded-full flex items-center justify-center shadow-lg">
                <Quote className="w-5 h-5 text-white" />
              </div>
              <p className="italic text-muted-foreground mb-6 leading-relaxed">"{testimonial.quote}"</p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-veri font-bold text-lg mr-3">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
