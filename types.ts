
export interface Student {
  userId: string;
  studentName: string;
  academicYear: string;
}

export interface Lecture {
  lectureName: string;
  lectureLink: string;
  academicYear: string;
  linkType: string; // 'فيديو' or 'pdf'
  thumbnailUrl?: string; // Optional: URL for video thumbnail
  subject?: string; // Optional: The subject of the lecture
}

export interface Question {
  questionText: string;
  options: string[];
  correctAnswer: string;
}

export interface Quiz {
  id: string;
  title: string;
  academicYear: string;
  questions: Question[];
}

export interface QuizSubmission {
  studentId: string;
  studentName: string;
  quizTitle: string;
  score: string; // e.g., "8/10"
}
