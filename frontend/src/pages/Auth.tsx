import { useState, useEffect } from 'react';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import CustomButton from '@/components/ui/CustomButton';
import { Mail, Lock, User, BookOpen, GraduationCap } from 'lucide-react';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';

type AuthMode = 'signin' | 'signup';

const Auth = () => {
  const { isAuthenticated, login, signup, isLoading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [role, setRole] = useState<UserRole>('teacher');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'signin') {
      await login(email, password, role);
    } else {
      await signup(name, email, password, role);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-secondary/30">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16 px-6 relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-veri/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 -right-20 w-96 h-96 bg-write/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 left-1/4 w-96 h-96 bg-veri/5 rounded-full blur-3xl"></div>
        </div>
      
        <div className="container mx-auto max-w-md relative z-10 animate-fade-in">
          <h1 className="text-3xl font-bold mb-8 text-center">
            {mode === 'signin' ? 'Welcome back to VeriWrite' : 'Create Your VeriWrite Account'}
          </h1>
          
          <GlassmorphismCard className="p-8 shadow-xl" intensity="heavy">
            <div className="mb-6 animate-slide-up">
              <p className="text-sm font-medium mb-2">Role:</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-300 ${
                    role === 'teacher'
                      ? 'border-veri bg-veri/10 text-foreground shadow-md'
                      : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                  }`}
                >
                  <BookOpen size={18} />
                  <span>Teacher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-300 ${
                    role === 'student'
                      ? 'border-veri bg-veri/10 text-foreground shadow-md'
                      : 'border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50'
                  }`}
                >
                  <GraduationCap size={18} />
                  <span>Student</span>
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-muted-foreground">
                      <User size={18} />
                    </span>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 p-3 bg-secondary/30 rounded-lg border border-border focus:border-veri/50 focus:outline-none focus:ring-2 focus:ring-veri/20 transition-all"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>
              )}
              
              <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
                <label htmlFor="email" className="block text-sm font-medium mb-1">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-muted-foreground">
                    <Mail size={18} />
                  </span>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 p-3 bg-secondary/30 rounded-lg border border-border focus:border-veri/50 focus:outline-none focus:ring-2 focus:ring-veri/20 transition-all"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>
              
              <div className="animate-slide-up" style={{ animationDelay: '300ms' }}>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium">Password</label>
                  {mode === 'signin' && (
                    <button 
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="text-xs text-veri hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-muted-foreground">
                    <Lock size={18} />
                  </span>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 p-3 bg-secondary/30 rounded-lg border border-border focus:border-veri/50 focus:outline-none focus:ring-2 focus:ring-veri/20 transition-all"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </div>
              </div>
              
              <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
                <CustomButton
                  type="submit"
                  fullWidth
                  loading={isLoading}
                  className="mt-2"
                >
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </CustomButton>
              </div>
            </form>
            
            <div className="mt-6 text-center animate-slide-up" style={{ animationDelay: '500ms' }}>
              <p className="text-sm text-muted-foreground">
                {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
                <button 
                  className="text-veri hover:underline font-medium transition-colors" 
                  onClick={toggleMode}
                  type="button"
                >
                  {mode === 'signin' ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </GlassmorphismCard>
        </div>
      </main>
      
      <Footer />
      
      <ForgotPasswordModal 
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />
    </div>
  );
};

export default Auth;
