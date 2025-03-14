
export interface Assignment {
  id: string;
  title: string;
  deadline: Date;
  submissionsCount: number;
  totalStudents: number;
  type: 'assignment' | 'exam';
  description?: string;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  students: number;
  color: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'blocked';
}
