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
import { useToast } from '@/hooks/use-toast'; // Import useToast

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ForgotPasswordModal = ({ isOpen, onClose }: ForgotPasswordModalProps) => {
  const { resetPassword, isLoading } = useAuth();
  const { toast } = useToast(); // Initialize toast
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  // const [isSubmitted, setIsSubmitted] = useState(false); // No longer needed for this logic

  const resetForm = () => {
    setEmail('');
    setError(null);
    // setIsSubmitted(false); // No longer needed
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
      // Call the resetPassword function from AuthContext.
      // This function will now directly show the "Feature Not Available" toast.
      await resetPassword(email);

      // IMPORTANT: After resetPassword (which already shows the toast),
      // we just close the modal. We don't set isSubmitted to true,
      // as the email was not actually sent.
      handleClose();

    } catch (error) {
      // The resetPassword function in AuthContext already handles its own toast,
      // so we don't need additional toast here. Just close the modal.
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
            {/* Always show the prompt to enter email, as we won't have a "submitted" state */}
            Enter your email address and we'll send you instructions to reset your password.
          </DialogDescription>
        </DialogHeader>

        {/* This entire section always remains as the input form */}
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
      </DialogContent>
    </Dialog>
  );
};

export default ForgotPasswordModal;