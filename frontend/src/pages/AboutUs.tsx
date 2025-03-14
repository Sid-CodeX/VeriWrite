
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';

const AboutUs = () => {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-28 pb-16 px-6">
        <div className="container max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">About VeriWrite</h1>
          
          <GlassmorphismCard className="mb-10 p-8">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-muted-foreground mb-6">
              At VeriWrite, our mission is to uphold academic integrity by providing educators with 
              powerful tools to detect plagiarism and foster a culture of original thinking. We believe 
              that original work should be recognized and valued, and we're committed to helping educational 
              institutions maintain high standards of academic honesty.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
            <p className="text-muted-foreground mb-6">
              VeriWrite was founded by a team of educators and technologists who recognized the 
              growing challenge of maintaining academic integrity in the digital age. With the 
              proliferation of online resources, the need for effective plagiarism detection became 
              increasingly critical.
            </p>
            <p className="text-muted-foreground mb-6">
              Our founders combined their expertise in education, machine learning, and software 
              development to create a solution that would not only detect similarities in text but 
              also integrate seamlessly with the tools educators already use, such as Google Classroom.
            </p>
            
            <h2 className="text-2xl font-semibold mb-4">What Sets Us Apart</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-6 pl-4">
              <li>Advanced detection algorithms that compare submissions against billions of online sources</li>
              <li>Seamless integration with Google Classroom for effortless document management</li>
              <li>Support for multiple document formats, including handwritten documents</li>
              <li>User-friendly interface designed specifically for educators</li>
              <li>Commitment to data privacy and security</li>
            </ul>
            
            <h2 className="text-2xl font-semibold mb-4">Our Team</h2>
            <p className="text-muted-foreground">
              VeriWrite is powered by a dedicated team of educators, developers, and customer support 
              specialists who are passionate about academic integrity. We work closely with educational 
              institutions to continuously improve our platform and provide the best possible experience 
              for our users.
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

export default AboutUs;
