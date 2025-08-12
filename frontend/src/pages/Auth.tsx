import { useState, useEffect } from 'react';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import { BookOpen, GraduationCap } from 'lucide-react';
import ForgotPasswordModal from '@/components/auth/ForgotPasswordModal';
import AuthForm from '@/components/AuthForm';

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
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signin') {
      await login(email, password, role);
    } else {
      await signup(name, email, password, role);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-secondary/30">
      <Navbar />
      <main className="flex-grow pt-24 pb-16 px-6 relative">
        <div className="container mx-auto max-w-md relative z-10">
          <h1 className="text-3xl font-bold mb-8 text-center">
            {mode === 'signin' ? 'Welcome back to VeriWrite' : 'Create Your VeriWrite Account'}
          </h1>
          
          <GlassmorphismCard className="p-8 shadow-xl" intensity="heavy">
            {/* Role Selector */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Role:</p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole('teacher')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${
                    role === 'teacher' ? 'border-veri bg-veri/10' : 'border-border bg-secondary/30'
                  }`}
                >
                  <BookOpen size={18} />
                  <span>Teacher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border ${
                    role === 'student' ? 'border-veri bg-veri/10' : 'border-border bg-secondary/30'
                  }`}
                >
                  <GraduationCap size={18} />
                  <span>Student</span>
                </button>
              </div>
            </div>

            {/* AuthForm */}
            <AuthForm
              mode={mode}
              setMode={setMode}
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              name={name}
              setName={setName}
              isLoading={isLoading}
              onSubmit={handleSubmit}
              onForgotPassword={() => setIsForgotPasswordOpen(true)}
            />
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
