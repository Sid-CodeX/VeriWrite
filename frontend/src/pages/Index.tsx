import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Footer from '@/components/Footer';
import { ArrowRight, CheckCircle } from 'lucide-react';
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
                Our advanced technology offers innovative features designed for modern academic environments.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
              <div className="p-6 rounded-xl bg-secondary/30 border border-border/50 hover:border-veri/20 hover:bg-secondary/40 transition-all duration-300">
                <div className="flex items-start mb-4">
                  <div className="p-3 rounded-full bg-veri/10 mr-4">
                    <CheckCircle className="text-veri" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Accurate Plagiarism Detection</h3>
                    <p className="text-muted-foreground">
                      Our algorithms accurately detect direct textual matches and subtle alterations to identify plagiarism effectively.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 pl-14">
                  {/* Adjusted bullet points based on your feedback */}
                  {["Textual matching", "Efficient processing", "Wide online source comparison"].map((item, i) => (
                    <li key={i} className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-veri mr-2"></span>
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 rounded-xl bg-secondary/30 border border-border/50 hover:border-veri/20 hover:bg-secondary/40 transition-all duration-300">
                <div className="flex items-start mb-4">
                  <div className="p-3 rounded-full bg-veri/10 mr-4">
                    <CheckCircle className="text-veri" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Comprehensive Reports</h3>
                    <p className="text-muted-foreground">
                      Get detailed reports with source tracking, similarity scores, and highlighted matches to make informed decisions.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 pl-14">
                  {["Source attribution", "Similarity breakdown", "Direct citation links"].map((item, i) => (
                    <li key={i} className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-veri mr-2"></span>
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 rounded-xl bg-secondary/30 border border-border/50 hover:border-veri/20 hover:bg-secondary/40 transition-all duration-300">
                <div className="flex items-start mb-4">
                  <div className="p-3 rounded-full bg-veri/10 mr-4">
                    <CheckCircle className="text-veri" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Integrated Virtual Classroom</h3>
                    <p className="text-muted-foreground">
                      Manage courses, assignments, and submissions in one unified platform designed specifically for academic integrity within your virtual classroom. Documents stored here for comparison against others will be deleted when the classroom is removed.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 pl-14">
                  {["Course management", "Assignment tracking", "Submission history"].map((item, i) => (
                    <li key={i} className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-veri mr-2"></span>
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 rounded-xl bg-secondary/30 border border-border/50 hover:border-veri/20 hover:bg-secondary/40 transition-all duration-300">
                <div className="flex items-start mb-4">
                  <div className="p-3 rounded-full bg-veri/10 mr-4">
                    <CheckCircle className="text-veri" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Multiple Document Formats</h3>
                    <p className="text-muted-foreground">
                      Support for various document types including handwritten documents through advanced OCR technology.
                    </p>
                  </div>
                </div>
                <ul className="space-y-2 pl-14">
                  {["PDF and DOCX support", "Handwritten text recognition", "Image-based document analysis"].map((item, i) => (
                    <li key={i} className="flex items-center">
                      <span className="w-2 h-2 rounded-full bg-veri mr-2"></span>
                      <span className="text-sm text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 text-center">
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
                    src="https://images.inc.com/uploaded_files/image/1920x1080/getty_481187762_97064797045000_100756.jpg"
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

        {/* Efficient Plagiarism Detection */}
        <section className="py-20 px-6 bg-secondary">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Efficient Plagiarism <span className="text-veri">Detection</span></h2>
                <p className="text-muted-foreground mb-6">
                  Compare submissions against a wide range of online content for thorough detection. Our optimized processing engine delivers results efficiently.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-veri text-white flex items-center justify-center text-sm font-bold">1</span>
                    <p className="text-muted-foreground pt-0.5">
                      Accurate detection of direct textual matches
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-veri text-white flex items-center justify-center text-sm font-bold">2</span>
                    <p className="text-muted-foreground pt-0.5">
                      Subtle alteration identification
                    </p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-veri text-white flex items-center justify-center text-sm font-bold">3</span>
                    <p className="text-muted-foreground pt-0.5">
                      Optimized processing for quick analysis
                    </p>
                  </li>
                </ul>
              </div>
              <div>
                <div className="glass-card p-1 rounded-xl overflow-hidden shadow-xl">
                  <img
                    src="https://blog.on-page.ai/wp-content/uploads/2023/06/How-AI-is-Helping-to-Detect-Plagiarism-in-Generated-Content.png"
                    alt="Advanced plagiarism detection technology"
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* New: Data Security & Privacy Section */}
        <section className="py-20 px-6 bg-gradient-to-b from-secondary/30 to-background">
            <div className="container mx-auto max-w-6xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="order-2 md:order-1">
                        <div className="glass-card p-1 rounded-xl overflow-hidden shadow-xl">
                            <img
                                src="https://png.pngtree.com/background/20220725/original/pngtree-data-security-abstract-light-effect-background-computer-privacy-picture-image_1776643.jpg"
                                alt="Data security and privacy"
                                className="w-full h-auto rounded-lg"
                            />
                        </div>
                    </div>
                    <div className="order-1 md:order-2">
                        <h2 className="text-3xl font-bold mb-6">Data Security & <span className="text-veri">Privacy</span></h2>
                        <p className="text-muted-foreground mb-6">
                            All uploads are encrypted and processed securely. Documents submitted for immediate checks are promptly deleted after processing or when the user logs out. Your documents remain private and protected at all times.
                        </p>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-veri text-white flex items-center justify-center text-sm font-bold">✓</span>
                                <p className="text-muted-foreground pt-0.5">
                                    End-to-end encryption for all document transfers.
                                </p>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-veri text-white flex items-center justify-center text-sm font-bold">✓</span>
                                <p className="text-muted-foreground pt-0.5">
                                    Strict data retention policies; non-classroom documents are not stored permanently.
                                </p>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-veri text-white flex items-center justify-center text-sm font-bold">✓</span>
                                <p className="text-muted-foreground pt-0.5">
                                    Classroom documents are used solely for internal comparison and deleted upon classroom removal.
                                </p>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

      </main>

      <Footer />
    </div>
  );
};

export default Index;