
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-secondary/70 backdrop-blur-sm py-10 px-6 border-t border-border/50">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">VeriWrite</h3>
            <p className="text-muted-foreground text-sm mb-4">
              An advanced plagiarism detection platform for educational institutions.
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/upload-check" className="text-muted-foreground hover:text-foreground transition-colors">
                  Upload & Check
                </Link>
              </li>
              <li>
                <Link to="/online-check" className="text-muted-foreground hover:text-foreground transition-colors">
                  Online Checker
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about-us" className="text-muted-foreground hover:text-foreground transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start space-x-3">
                <Mail size={18} className="text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">veriwrite@gmail.com</span>
              </li>
              <li className="flex items-start space-x-3">
                <Phone size={18} className="text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">+91 9876543210</span>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin size={18} className="text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  VeriWrite, MITS<br />
                  Varikoli P.O, Puthencruz<br />
                  682308, India
                </span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-border/50 text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} VeriWrite. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
