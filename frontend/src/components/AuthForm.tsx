
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import CustomButton from '@/components/ui/CustomButton';
import { Mail, Lock, User } from 'lucide-react';

type AuthMode = 'signin' | 'signup';

const AuthForm = () => {
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // In a real application, you would handle authentication here
    // This is just a simulation for demo purposes
    setTimeout(() => {
      setIsLoading(false);
      
      if (mode === 'signin') {
        toast({
          title: "Signed in successfully",
          description: "Welcome back to VeriWrite!",
        });
      } else {
        toast({
          title: "Account created successfully",
          description: "Welcome to VeriWrite!",
        });
      }
      
      // Clear form
      setEmail('');
      setPassword('');
      setName('');
    }, 1500);
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    // Reset form when switching modes
    setEmail('');
    setPassword('');
    setName('');
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {mode === 'signin' ? 'Sign In' : 'Create Account'}
        </h2>
        <p className="text-muted-foreground">
          {mode === 'signin' 
            ? 'Sign in to access your VeriWrite account' 
            : 'Create a new account to get started with VeriWrite'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="John Doe"
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
          <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
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
        
        <div>
          <CustomButton
            type="submit"
            fullWidth
            loading={isLoading}
          >
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
          </CustomButton>
        </div>
      </form>
      
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
    </div>
  );
};

export default AuthForm;
