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

            <h2 className="text-2xl font-semibold mb-4">1. Our Commitment to Your Privacy</h2>
            <p className="text-muted-foreground mb-6">
              At VeriWrite, we respect your privacy. This policy explains what information we gather when you use our plagiarism checking tools and how we handle it.
            </p>

            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <p className="text-muted-foreground mb-4">
              We collect information you provide directly to us when you interact with our service:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6 pl-4">
              <li>Account Information: Such as your name, email address, and institutional details when you create an account.</li>
              <li>Content for Plagiarism Checking:
                <ul>
                  <li>For "Upload and Check" and "Online Check" features, we take the extracted text of the document you provide for real-time plagiarism analysis.</li>
                  <li>For submissions within our "Virtual Classroom" feature, we store the extracted text of the documents you upload.</li>
                </ul>
              </li>
              <li>Usage Data: Basic information about how you interact with our service to help us understand and improve it.</li>
            </ul>

            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-6">
              We use the information collected to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6 pl-4">
              <li>Provide and maintain our plagiarism detection service.</li>
              <li>Manage and facilitate the use of our Virtual Classroom feature.</li>
              <li>Respond to your support inquiries.</li>
              <li>Improve the functionality and performance of VeriWrite.</li>
            </ul>

            <h2 className="text-2xl font-semibold mb-4">4. Data Retention Policy</h2>
            <p className="text-muted-foreground mb-4">
              Our policy on retaining your data is as follows:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6 pl-4">
              <li>
                For "Upload and Check" and "Online Check" Features: After the plagiarism check is completed for content submitted via "Upload and Check" or "Online Check," both the extracted text and the generated plagiarism report are immediately deleted from our storage. We do not retain this content.
              </li>
              <li>
                For "Virtual Classroom" Submissions: The extracted text from documents uploaded as part of assignments in our Virtual Classroom is stored. This is specifically for the purpose of comparison among all other submissions within that assignment and classroom. The stored extracted text will be permanently deleted from our storage when the specific assignment is deleted or when the entire virtual classroom is deleted.
              </li>
            </ul>

            <h2 className="text-2xl font-semibold mb-4">5. Sharing of Information</h2>
            <p className="text-muted-foreground mb-6">
              We do not share your personal information or the content you submit for checking with any third parties, except if legally required.
            </p>

            <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
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