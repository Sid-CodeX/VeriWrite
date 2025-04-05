
import { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import Footer from '@/components/Footer';
import { Mail } from 'lucide-react';

// Team member data
const teamMembers = [
  {
    name: 'Sidharth P',
    email: 'sidharth@example.com',
    image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=2080',
    role: 'Project Lead'
  },
  {
    name: 'Rahul Koshy Manoj',
    email: 'rahul@example.com',
    image: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070',
    role: 'Full Stack Developer'
  },
  {
    name: 'Mariya Jose',
    email: 'mariya@example.com',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887',
    role: 'UI/UX Designer'
  },
  {
    name: 'Archana Mukundan',
    email: 'archana@example.com',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1964',
    role: 'Backend Developer'
  }
];

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
            <p className="text-muted-foreground mb-6">
              VeriWrite is powered by a dedicated team of educators, developers, and customer support 
              specialists who are passionate about academic integrity. We work closely with educational 
              institutions to continuously improve our platform and provide the best possible experience 
              for our users.
            </p>
          </GlassmorphismCard>
          
          {/* Team Members Section */}
          <h2 className="text-3xl font-bold mb-6 text-center">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {teamMembers.map((member, index) => (
              <GlassmorphismCard key={index} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-1/3 h-48 sm:h-auto">
                    <img 
                      src={member.image} 
                      alt={`${member.name} profile`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6 sm:w-2/3 flex flex-col justify-center">
                    <h3 className="text-xl font-bold">{member.name}</h3>
                    <p className="text-muted-foreground text-sm mb-2">{member.role}</p>
                    <div className="flex items-center mt-2 text-muted-foreground">
                      <Mail size={16} className="mr-2" />
                      <a href={`mailto:${member.email}`} className="text-sm hover:text-veri transition-colors">
                        {member.email}
                      </a>
                    </div>
                  </div>
                </div>
              </GlassmorphismCard>
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AboutUs;
