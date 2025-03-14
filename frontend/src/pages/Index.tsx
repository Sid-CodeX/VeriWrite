
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import FeatureComparison from '@/components/FeatureComparison';
import Testimonials from '@/components/Testimonials';
import Logo from '@/components/Logo';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import CustomButton from '@/components/ui/CustomButton';

const Index = () => {
  const navigate = useNavigate();
  
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main>
        <Hero />
        <Features />
        
        {/* How VeriWrite is Different Section */}
        <section className="py-20 px-6 bg-gradient-to-b from-background to-secondary/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How VeriWrite is <span className="text-veri">Different</span></h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our advanced technology goes beyond traditional plagiarism detection tools, offering innovative features designed for modern academic environments.
              </p>
            </div>
            
            <FeatureComparison />
            
            <div className="mt-16 text-center">
              <CustomButton onClick={() => navigate('/auth')} icon={<ArrowRight className="ml-2 h-4 w-4" />} iconPosition="right">
                Get Started Now
              </CustomButton>
            </div>
          </div>
        </section>
        
        {/* Handwritten Document Detection */}
        <section className="py-20 px-6 relative overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-5">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=1500&q=80')] bg-fixed bg-center bg-no-repeat bg-cover"></div>
          </div>
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="glass-card p-1 rounded-xl overflow-hidden shadow-xl">
                  <img 
                    src="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80" 
                    alt="Handwritten document scanning technology" 
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
              <div className="order-1 md:order-2">
                <h2 className="text-3xl font-bold mb-6">Handwritten Document <span className="text-veri">Detection</span></h2>
                <p className="text-muted-foreground mb-6">
                  Our revolutionary technology can analyze handwritten documents, converting them to text for thorough plagiarism checking – a feature most competitors don't offer.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-veri text-white flex items-center justify-center text-sm font-bold">1</span>
                    <p className="text-muted-foreground pt-0.5">
                      Upload scanned handwritten documents in multiple formats
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-veri text-white flex items-center justify-center text-sm font-bold">2</span>
                    <p className="text-muted-foreground pt-0.5">
                      Advanced OCR technology converts handwriting to digital text
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-veri text-white flex items-center justify-center text-sm font-bold">3</span>
                    <p className="text-muted-foreground pt-0.5">
                      Compare against our extensive database and online sources
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* Advanced Plagiarism Detection */}
        <section className="py-20 px-6 bg-secondary">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Advanced Plagiarism <span className="text-veri">Detection</span></h2>
                <p className="text-muted-foreground mb-6">
                  Our sophisticated algorithms don't just match text – they understand context, language patterns, and writing style to identify even cleverly disguised plagiarism.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-veri text-white flex items-center justify-center text-sm font-bold">1</span>
                    <p className="text-muted-foreground pt-0.5">
                      Semantic analysis detects paraphrased content
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-veri text-white flex items-center justify-center text-sm font-bold">2</span>
                    <p className="text-muted-foreground pt-0.5">
                      Cross-language detection identifies translated plagiarism
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-veri text-white flex items-center justify-center text-sm font-bold">3</span>
                    <p className="text-muted-foreground pt-0.5">
                      Source tracking provides comprehensive citation information
                    </p>
                  </li>
                </ul>
              </div>
              <div>
                <div className="glass-card p-1 rounded-xl overflow-hidden shadow-xl">
                  <img 
                    src="https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80" 
                    alt="Advanced plagiarism detection technology" 
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <Testimonials />
      </main>
      
      {/* Footer */}
      <footer className="bg-secondary py-12 px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <Logo className="mb-4" />
              <p className="text-muted-foreground text-sm">
                Advanced plagiarism detection for educators committed to academic integrity.
              </p>
            </div>
            
            <div className="md:col-span-1">
              <h4 className="font-medium text-lg mb-4">Products</h4>
              <ul className="space-y-2">
                <li><Link to="/classroom" className="text-muted-foreground hover:text-foreground text-sm">Classroom</Link></li>
                <li><Link to="/upload-check" className="text-muted-foreground hover:text-foreground text-sm">Upload & Check</Link></li>
                <li><Link to="/online-check" className="text-muted-foreground hover:text-foreground text-sm">Online Check</Link></li>
              </ul>
            </div>
            
            <div className="md:col-span-1">
              <h4 className="font-medium text-lg mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-muted-foreground hover:text-foreground text-sm">About Us</Link></li>
                <li><Link to="/contact" className="text-muted-foreground hover:text-foreground text-sm">Contact Us</Link></li>
                <li><Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground text-sm">Privacy Policy</Link></li>
                <li><Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground text-sm">Terms of Service</Link></li>
              </ul>
            </div>
            
            <div className="md:col-span-1">
              <h4 className="font-medium text-lg mb-4">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Mail size={16} className="text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground text-sm">22cs362@mgits.ac</span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone size={16} className="text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground text-sm">+1 (555) 123-4567</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin size={16} className="text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground text-sm">123 Academic Ave, Education City, EC 12345</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border/50 mt-12 pt-8 text-center">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} VeriWrite. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
