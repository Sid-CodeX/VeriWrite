
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';

const TermsOfService = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-28 pb-16 px-6">
        <div className="container max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">Terms of Service</h1>
          
          <GlassmorphismCard className="mb-10 p-8">
            <p className="text-muted-foreground mb-6">
              Last Updated: {new Date().toLocaleDateString()}
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">1. Agreement to Terms</h2>
            <p className="text-muted-foreground mb-6">
              By accessing or using VeriWrite's services, you agree to be bound by these Terms of Service 
              and all applicable laws and regulations. If you do not agree with any of these terms, you 
              are prohibited from using or accessing our services.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
            <p className="text-muted-foreground mb-6">
              VeriWrite grants you a limited, non-exclusive, non-transferable, revocable license to 
              use our services for personal or educational purposes in accordance with these Terms.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">3. User Responsibilities</h2>
            <p className="text-muted-foreground mb-6">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6 pl-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring that your use of our services complies with applicable laws and regulations</li>
              <li>Obtaining proper authorization to submit documents for plagiarism checking</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mb-4">4. Intellectual Property</h2>
            <p className="text-muted-foreground mb-6">
              VeriWrite and its content, features, and functionality are owned by VeriWrite and are 
              protected by international copyright, trademark, patent, trade secret, and other 
              intellectual property or proprietary rights laws.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">5. Termination</h2>
            <p className="text-muted-foreground mb-6">
              We may terminate or suspend your account and access to our services immediately, without 
              prior notice or liability, for any reason, including without limitation if you breach these Terms.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">6. Limitation of Liability</h2>
            <p className="text-muted-foreground mb-6">
              In no event shall VeriWrite be liable for any indirect, incidental, special, consequential, 
              or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
              or other intangible losses, resulting from your access to or use of or inability to access 
              or use the services.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms, please contact us at: 
              <a href="mailto:22cs362@mgits.ac" className="text-veri hover:underline ml-1">
                22cs362@mgits.ac
              </a>
            </p>
          </GlassmorphismCard>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-secondary py-6 px-6">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} VeriWrite. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService;
