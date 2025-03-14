
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CustomButton from '@/components/ui/CustomButton';
import GlassmorphismCard from '@/components/ui/GlassmorphismCard';
import { Search, BarChart4, FileText, User, Book, CheckCircle, ChevronRight, LogOut } from 'lucide-react';

// Mock data for the dashboard
const mockCourses = [
  { id: 1, name: 'Introduction to Computer Science', students: 32, assignments: 8 },
  { id: 2, name: 'Advanced Mathematics', students: 24, assignments: 12 },
  { id: 3, name: 'English Literature', students: 28, assignments: 10 },
  { id: 4, name: 'Biology 101', students: 35, assignments: 9 },
];

const mockAssignments = [
  { id: 1, name: 'Final Essay', course: 'English Literature', due: '2023-06-10', submissions: 25, scanned: 18 },
  { id: 2, name: 'Research Paper', course: 'Introduction to Computer Science', due: '2023-06-15', submissions: 30, scanned: 22 },
  { id: 3, name: 'Problem Set 5', course: 'Advanced Mathematics', due: '2023-06-08', submissions: 20, scanned: 20 },
  { id: 4, name: 'Lab Report', course: 'Biology 101', due: '2023-06-12', submissions: 33, scanned: 28 },
];

const Dashboard = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCourses, setFilteredCourses] = useState(mockCourses);
  const [filteredAssignments, setFilteredAssignments] = useState(mockAssignments);
  
  // Handle search
  useEffect(() => {
    if (searchQuery) {
      setFilteredCourses(mockCourses.filter(course => 
        course.name.toLowerCase().includes(searchQuery.toLowerCase())
      ));
      setFilteredAssignments(mockAssignments.filter(assignment => 
        assignment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.course.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    } else {
      setFilteredCourses(mockCourses);
      setFilteredAssignments(mockAssignments);
    }
  }, [searchQuery]);

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-secondary/30">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16 px-6">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div className="opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
              <h1 className="text-3xl font-bold">Teacher Dashboard</h1>
              <p className="text-muted-foreground">Manage your courses and check submissions for plagiarism</p>
            </div>
            
            <div className="flex gap-4 opacity-0 animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="pl-10 pr-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-veri/20 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} 
                />
              </div>
              <CustomButton 
                variant="outline" 
                size="sm" 
                icon={<LogOut size={16} />}
              >
                Logout
              </CustomButton>
            </div>
          </div>
          
          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { 
                title: 'Total Courses', 
                value: mockCourses.length, 
                icon: <Book className="text-veri" size={24} />,
                delay: '0.3s'
              },
              { 
                title: 'Total Students', 
                value: mockCourses.reduce((acc, course) => acc + course.students, 0), 
                icon: <User className="text-veri" size={24} />,
                delay: '0.4s'
              },
              { 
                title: 'Assignments', 
                value: mockAssignments.length, 
                icon: <FileText className="text-veri" size={24} />,
                delay: '0.5s'
              },
              { 
                title: 'Scanned Documents', 
                value: mockAssignments.reduce((acc, assignment) => acc + assignment.scanned, 0), 
                icon: <CheckCircle className="text-veri" size={24} />,
                delay: '0.6s'
              }
            ].map((stat, index) => (
              <div 
                key={index} 
                className="opacity-0 animate-fade-in" 
                style={{ animationDelay: stat.delay, animationFillMode: 'forwards' }}
              >
                <GlassmorphismCard intensity="light" className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-muted-foreground text-sm">{stat.title}</p>
                      <p className="text-3xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <div className="p-3 rounded-full bg-veri/10">
                      {stat.icon}
                    </div>
                  </div>
                </GlassmorphismCard>
              </div>
            ))}
          </div>
          
          {/* Recent Courses */}
          <div className="mb-8 opacity-0 animate-fade-in" style={{ animationDelay: '0.7s', animationFillMode: 'forwards' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Your Courses</h2>
              <a href="#" className="text-sm text-veri hover:underline flex items-center">
                View All <ChevronRight size={16} />
              </a>
            </div>
            <div className="bg-background rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Course Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Students</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Assignments</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCourses.map((course) => (
                      <tr key={course.id} className="hover:bg-secondary/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium">{course.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <User size={16} className="text-muted-foreground mr-2" />
                            <span>{course.students}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FileText size={16} className="text-muted-foreground mr-2" />
                            <span>{course.assignments}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <CustomButton variant="outline" size="sm">View Details</CustomButton>
                        </td>
                      </tr>
                    ))}
                    {filteredCourses.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-muted-foreground">
                          No courses found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Recent Assignments */}
          <div className="opacity-0 animate-fade-in" style={{ animationDelay: '0.8s', animationFillMode: 'forwards' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Recent Assignments</h2>
              <a href="#" className="text-sm text-veri hover:underline flex items-center">
                View All <ChevronRight size={16} />
              </a>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAssignments.map((assignment) => (
                <GlassmorphismCard key={assignment.id} className="p-6">
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold mb-1">{assignment.name}</h3>
                      <p className="text-sm text-muted-foreground">{assignment.course}</p>
                    </div>
                    <CustomButton variant="outline" size="sm" icon={<BarChart4 size={16} />}>
                      Check
                    </CustomButton>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Due Date</p>
                        <p className="text-sm">{new Date(assignment.due).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Submissions</p>
                        <p className="text-sm">{assignment.submissions}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Scanned</p>
                        <p className="text-sm">{assignment.scanned}</p>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      assignment.submissions === assignment.scanned 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {assignment.submissions === assignment.scanned ? 'Complete' : 'In Progress'}
                    </div>
                  </div>
                </GlassmorphismCard>
              ))}
              {filteredAssignments.length === 0 && (
                <div className="col-span-2 text-center p-8 border border-border rounded-lg bg-secondary/30">
                  <p className="text-muted-foreground">No assignments found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      {/* Simple footer */}
      <footer className="bg-secondary py-6 px-6">
        <div className="container mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} VeriWrite. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
