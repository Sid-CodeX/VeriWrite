
export interface Student {
  id: string;
  rollNo: string;
  name: string;
  email: string;
  submission?: {
    fileName: string;
    submittedAt: Date;
    checked: boolean;
    similarity?: number;
  };
}

export const getMockStudents = (): Student[] => [
  {
    id: '1',
    rollNo: 'CS001',
    name: 'John Doe',
    email: 'john@example.com',
    submission: {
      fileName: 'assignment1_john.pdf',
      submittedAt: new Date(2023, 10, 5),
      checked: true,
      similarity: 12
    }
  },
  {
    id: '2',
    rollNo: 'CS002',
    name: 'Jane Smith',
    email: 'jane@example.com',
    submission: {
      fileName: 'jane_smith_submission.docx',
      submittedAt: new Date(2023, 10, 4),
      checked: true,
      similarity: 28
    }
  },
  {
    id: '3',
    rollNo: 'CS003',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    submission: {
      fileName: 'bob_assignment.pdf',
      submittedAt: new Date(2023, 10, 7),
      checked: false
    }
  },
  {
    id: '4',
    rollNo: 'CS004',
    name: 'Alice Brown',
    email: 'alice@example.com',
    submission: {
      fileName: 'alice_brown.docx',
      submittedAt: new Date(2023, 10, 6),
      checked: true,
      similarity: 5
    }
  },
  {
    id: '5',
    rollNo: 'CS005',
    name: 'Charlie Wilson',
    email: 'charlie@example.com'
  },
  {
    id: '6',
    rollNo: 'CS006',
    name: 'Diana Miller',
    email: 'diana@example.com',
    submission: {
      fileName: 'diana_submission.pdf',
      submittedAt: new Date(2023, 10, 3),
      checked: true,
      similarity: 42
    }
  },
  {
    id: '7',
    rollNo: 'CS007',
    name: 'Ethan Davis',
    email: 'ethan@example.com',
    submission: {
      fileName: 'ethan_assignment.docx',
      submittedAt: new Date(2023, 10, 5),
      checked: false
    }
  },
  {
    id: '8',
    rollNo: 'CS008',
    name: 'Fiona Rodriguez',
    email: 'fiona@example.com',
    submission: {
      fileName: 'fiona_rodriguez.pdf',
      submittedAt: new Date(2023, 10, 7),
      checked: true,
      similarity: 15
    }
  },
  {
    id: '9',
    rollNo: 'CS010',
    name: 'Greg Thomas',
    email: 'greg@example.com'
  },
  {
    id: '10',
    rollNo: 'CS011',
    name: 'Hannah White',
    email: 'hannah@example.com',
    submission: {
      fileName: 'hannah_assignment.docx',
      submittedAt: new Date(2023, 10, 2),
      checked: true,
      similarity: 8
    }
  }
];
