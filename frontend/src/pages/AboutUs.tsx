import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import Footer from '@/components/Footer';
import { Mail } from 'lucide-react';

// Team member data
const teamMembers = [
  { name: 'Sidharth P', email: '22cs362@mgits.ac.in' },
  { name: 'Rahul Koshy Manoj', email: '22cs355@mgits.ac.in' },
  { name: 'Mariya Jose', email: '22cs204@mgits.ac.in' },
  { name: 'Archana Mukundan', email: '22cs266@mgits.ac.in' }
];

const AboutUs = () => {
  // Automatically scroll to the top of the page when the component is mounted
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation bar */}
      <Navbar />

      {/* Main content */}
      <main className="flex-grow pt-28 pb-16 px-6">
        <div className="container max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">About VeriWrite</h1>

          {/* Mission, Story, and Vision */}
          <GlassmorphismCard className="mb-10 p-8">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-muted-foreground mb-6">
              At VeriWrite, our mission is to uphold academic integrity by providing educators with
              powerful tools to detect plagiarism and foster a culture of original thinking. We aim
              to recognize and value original work while supporting institutions in maintaining high standards.
            </p>

            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p className="text-muted-foreground mb-6">
              VeriWrite was created by a group of students passionate about addressing the rising
              challenges of academic dishonesty in the digital era. We saw the urgent need for a tool
              that goes beyond simple text matching.
            </p>
            <p className="text-muted-foreground mb-6">
              By combining skills in software engineering, AI, and educational tools, we built a
              solution that seamlessly integrates plagiarism detection with classroom workflows.
            </p>

            <h2 className="text-2xl font-semibold mb-4">What Sets Us Apart</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6 pl-4">
              <li>Advanced algorithms comparing submissions against internal and external sources</li>
              <li>Integrated classroom tools for easy assignment and submission handling</li>
              <li>Support for scanned documents and handwritten text extraction via OCR</li>
              <li>Clean, accessible UI tailored for both educators and learners</li>
              <li>Strong emphasis on user privacy and data security</li>
            </ul>

            <h2 className="text-2xl font-semibold mb-4">Our Team</h2>
            <p className="text-muted-foreground mb-6">
              VeriWrite is a student-led initiative. Each team member plays a crucial role in ideation,
              development, and ongoing enhancements to make the platform more impactful.
            </p>

            {/* Optional group photo can be added here in the future */}
            {/*
              <img
                src="/path/to/your/group-photo.jpg"
                alt="VeriWrite Team Group Photo"
                className="w-full rounded-md object-cover mb-6"
              />
            */}
          </GlassmorphismCard>

          {/* Developer Team Section */}
          <h2 className="text-3xl font-bold mb-6 text-center">Meet the Developers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {teamMembers.map((member, index) => (
              <GlassmorphismCard key={index} className="overflow-hidden p-6 flex items-center">
                <div className="flex flex-col flex-grow">
                  <h3 className="text-xl font-bold">{member.name}</h3>
                  <div className="flex items-center mt-2 text-muted-foreground">
                    <Mail size={16} className="mr-2" />
                    <a
                      href={`mailto:${member.email}`}
                      className="text-sm hover:text-veri transition-colors"
                    >
                      {member.email}
                    </a>
                  </div>
                </div>
              </GlassmorphismCard>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default AboutUs;
