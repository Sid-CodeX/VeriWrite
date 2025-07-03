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

            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground mb-6">
              By using VeriWrite's services, you agree to these simplified terms. If you do not agree,
              please refrain from using our services.
            </p>

            <h2 className="text-2xl font-semibold mb-4">2. Usage</h2>
            <p className="text-muted-foreground mb-6">
              VeriWrite is provided for personal or educational use.
            </p>

            <h2 className="text-2xl font-semibold mb-4">3. Our Data Policy</h2>
            <p className="text-muted-foreground mb-4">
              We manage your data as follows:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6 pl-4">
              <li>
                For "Upload and Check" and "Online Check": We do not store any content you submit through these features after the checking process is completed. Your data is used for the check and then immediately discarded.
              </li>
              <li>
                For Classroom Assignments: For submissions made within classroom assignments, we store the extracted text and associated metadata. This data is retained only for the active duration of that specific assignment or course. When an assignment or course is deleted by the instructor, all linked student submissions and their extracted content are permanently removed.
              </li>
            </ul>

            <h2 className="text-2xl font-semibold mb-4">4. Your Responsibilities</h2>
            <p className="text-muted-foreground mb-6">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6 pl-4">
              <li>Keeping your account information secure.</li>
              <li>All actions performed under your account.</li>
              <li>Using our services in a lawful and appropriate manner.</li>
              <li>Ensuring you have permission to submit documents for checking.</li>
            </ul>

            <h2 className="text-2xl font-semibold mb-4">5. Service Availability</h2>
            <p className="text-muted-foreground mb-6">
              We may modify or discontinue the service at any time without prior notice. Access may be restricted if these terms are violated.
            </p>

            <h2 className="text-2xl font-semibold mb-4">6. Contact Us</h2>
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