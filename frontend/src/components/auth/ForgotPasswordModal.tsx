
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal = ({ isOpen, onClose }: ForgotPasswordModalProps) => {
  const { resetPassword, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const resetForm = () => {
    setEmail('');
    setError(null);
    setIsSubmitted(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic email validation
    if (!email || !email.includes('@')) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (error) {
      // Error is handled in the resetPassword function
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            {isSubmitted 
              ? "Check your email for password reset instructions."
              : "Enter your email address and we'll send you instructions to reset your password."}
          </DialogDescription>
        </DialogHeader>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {error && (
              <div className="text-sm font-medium text-destructive mb-2">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Sending..." : "Send Reset Instructions"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="py-6 text-center">
            <p className="text-muted-foreground mb-4">
              If an account exists with the email <span className="font-medium text-foreground">{email}</span>, 
              you will receive password reset instructions shortly.
            </p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordModal;
