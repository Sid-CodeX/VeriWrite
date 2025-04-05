
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Mail, GraduationCap, BookOpen, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PasswordResetModal from '@/components/profile/PasswordResetModal';

const Profile = () => {
  const { user, updateProfile, isLoading } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Scroll to top on page load
  useState(() => {
    window.scrollTo(0, 0);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      await updateProfile({ name });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Could not update profile information",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-secondary/30">
      <Navbar />
      
      <main className="flex-grow pt-32 pb-16 px-6">
        <div className="container mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold mb-8">My Profile</h1>
          
          <GlassmorphismCard className="p-8 shadow-xl">
            {!user ? (
              <div className="text-center py-8">
                <p>You must be logged in to view this page.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-20 w-20 rounded-full bg-veri/10 flex items-center justify-center text-veri text-2xl font-semibold">
                    {name.split(' ').map(part => part[0]).join('').toUpperCase().substring(0, 2)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">{user.name}</h2>
                    <p className="text-muted-foreground">{user.email}</p>
                    <div className="flex items-center mt-1 text-sm">
                      {user.role === 'teacher' ? (
                        <div className="flex items-center text-veri">
                          <BookOpen size={14} className="mr-1" />
                          <span>Teacher</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-write">
                          <GraduationCap size={14} className="mr-1" />
                          <span>Student</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-border/50 pt-6 mt-6">
                  <h3 className="text-xl font-semibold mb-4">Account Information</h3>
                  
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pl-10"
                            placeholder="Your name"
                            required
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            value={user.email}
                            className="pl-10 bg-muted"
                            readOnly
                            disabled
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                      </div>
                      
                      <div className="pt-4 flex justify-end gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setIsEditing(false);
                            setName(user.name);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || name === user.name}>
                          {isLoading ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                          <p className="font-medium">{user.name}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Email Address</p>
                          <p className="font-medium">{user.email}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-muted-foreground">Role</p>
                          <p className="font-medium capitalize">{user.role}</p>
                        </div>
                      </div>
                      
                      <div className="pt-4 flex flex-wrap gap-3">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsEditing(true)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => setIsPasswordModalOpen(true)}
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Reset Password
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </GlassmorphismCard>
        </div>
      </main>
      
      <Footer />
      
      <PasswordResetModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

export default Profile;
