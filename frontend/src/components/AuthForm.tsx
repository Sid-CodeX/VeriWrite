import { Mail, Lock, User } from 'lucide-react';
import CustomButton from '@/components/ui/CustomButton';

type AuthMode = 'signin' | 'signup';

interface AuthFormProps {
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  email: string;
  setEmail: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  name: string;
  setName: (val: string) => void;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onForgotPassword?: () => void;
}

const AuthForm = ({
  mode,
  setMode,
  email,
  setEmail,
  password,
  setPassword,
  name,
  setName,
  isLoading,
  onSubmit,
  onForgotPassword
}: AuthFormProps) => {

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === 'signup' && (
        <div>
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
              className="w-full pl-10 p-3 bg-secondary/30 rounded-lg border border-border focus:border-veri/50 focus:outline-none"
              placeholder="Your name"
              required
            />
          </div>
        </div>
      )}

      <div>
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
            className="w-full pl-10 p-3 bg-secondary/30 rounded-lg border border-border focus:border-veri/50 focus:outline-none"
            placeholder="your@email.com"
            required
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label htmlFor="password" className="block text-sm font-medium">Password</label>
          {mode === 'signin' && onForgotPassword && (
            <button
              type="button"
              onClick={onForgotPassword}
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
            className="w-full pl-10 p-3 bg-secondary/30 rounded-lg border border-border focus:border-veri/50 focus:outline-none"
            placeholder="••••••••"
            required
            minLength={8}
          />
        </div>
      </div>

      <CustomButton type="submit" fullWidth loading={isLoading}>
        {mode === 'signin' ? 'Sign In' : 'Create Account'}
      </CustomButton>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
          <button
            className="text-veri hover:underline"
            onClick={toggleMode}
            type="button"
          >
            {mode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </form>
  );
};

export default AuthForm;
