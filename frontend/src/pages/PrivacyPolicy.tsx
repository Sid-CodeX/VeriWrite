
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';

const PrivacyPolicy = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-28 pb-16 px-6">
        <div className="container max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">Privacy Policy</h1>
          
          <GlassmorphismCard className="mb-10 p-8">
            <p className="text-muted-foreground mb-6">
              Last Updated: {new Date().toLocaleDateString()}
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground mb-6">
              At VeriWrite, we take your privacy seriously. This Privacy Policy explains how we collect, 
              use, and protect your personal information when you use our plagiarism detection service.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <p className="text-muted-foreground mb-6">
              We collect information that you provide directly to us, such as when you create an account, 
              upload documents for plagiarism checking, or contact us for support. This may include:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6 pl-4">
              <li>Contact information (name, email address, institution)</li>
              <li>Account credentials</li>
              <li>Content of documents uploaded for plagiarism checking</li>
              <li>Information from integrations (such as Google Classroom)</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-6">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6 pl-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process and complete transactions</li>
              <li>Send technical notices, updates, and support messages</li>
              <li>Respond to comments, questions, and requests</li>
              <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mb-4">4. Data Retention</h2>
            <p className="text-muted-foreground mb-6">
              We retain your information for as long as your account is active or as needed to provide 
              you services. We will also retain and use your information as necessary to comply with 
              our legal obligations, resolve disputes, and enforce our agreements.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">5. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us at: 
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

export default PrivacyPolicy;
