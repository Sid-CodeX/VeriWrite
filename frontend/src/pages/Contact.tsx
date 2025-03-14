
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import CustomButton from '@/components/ui/CustomButton';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import Footer from '@/components/Footer';

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate sending email
    setTimeout(() => {
      setIsSubmitting(false);
      
      toast({
        title: "Message sent successfully",
        description: `Your message has been sent to 22cs362@mgits.ac. We'll get back to you shortly.`
      });
      
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container max-w-6xl mx-auto pt-28 pb-16 px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Have questions about VeriWrite? We're here to help. Reach out to our team
            and we'll get back to you as soon as possible.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <GlassmorphismCard>
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Send us a message</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-1">Your Name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full p-3 bg-secondary/30 rounded-lg border border-border focus:border-veri/50 focus:outline-none"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1">Your Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full p-3 bg-secondary/30 rounded-lg border border-border focus:border-veri/50 focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium mb-1">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full p-3 bg-secondary/30 rounded-lg border border-border focus:border-veri/50 focus:outline-none"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-1">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={6}
                      className="w-full p-3 bg-secondary/30 rounded-lg border border-border focus:border-veri/50 focus:outline-none resize-none"
                      required
                    ></textarea>
                  </div>
                  
                  <div>
                    <CustomButton
                      type="submit"
                      loading={isSubmitting}
                      icon={<Send size={16} />}
                      iconPosition="right"
                    >
                      Send Message
                    </CustomButton>
                  </div>
                </form>
              </div>
            </GlassmorphismCard>
          </div>
          
          <div>
            <GlassmorphismCard>
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-full bg-veri/10 text-veri">
                      <Mail size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium">Email</h3>
                      <p className="text-muted-foreground mt-1">
                        <a href="mailto:22cs362@mgits.ac" className="hover:text-veri">
                          22cs362@mgits.ac
                        </a>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-full bg-veri/10 text-veri">
                      <Phone size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium">Phone</h3>
                      <p className="text-muted-foreground mt-1">+91 9876543210</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-full bg-veri/10 text-veri">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium">Address</h3>
                      <p className="text-muted-foreground mt-1">
                        VeriWrite, Muthoot Institute of Technology and Science<br />
                        Varikoli P.O, Puthencruz - 682308<br />
                        India
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="font-medium mb-4">Office Hours</h3>
                  <div className="bg-secondary/30 p-4 rounded-lg border border-border">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Monday - Friday:</span>
                        <span>9:00 AM - 5:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Saturday:</span>
                        <span>10:00 AM - 2:00 PM</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sunday:</span>
                        <span>Closed</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </GlassmorphismCard>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Contact;
