import { Student, Lecture, Quiz, Question, QuizSubmission } from '../types';

// =========================================================================================
// هام: تأكد من أن هذه الملفات مشتركة بحيث يمكن "لأي شخص لديه الرابط" أن "يعرض" المحتوى.
// =========================================================================================
const STUDENTS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1e-M7EZ7cKqgBTBuF8gUttEE28RqxKz4ClpWBwqDOLvU/export?format=csv';
const CONTENT_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1_uVs0IaENLP5LvpVUUW9gAmiWqeYcZndc9dNFtdpLyA/export?format=csv';
const QUIZZES_SHEET_URL = 'https://docs.google.com/spreadsheets/d/12mWTDeeZd-HHH-5-P6Prq-6i8-EBNSeXJkCCDvSuHJ4/export?format=csv';

// =========================================================================================
// هام: هذا هو الرابط الذي ستحصل عليه بعد نشر Google Apps Script (الخطوة 3).
// =========================================================================================
const QUIZ_SUBMISSION_URL = 'https://script.google.com/macros/s/AKfycbyB0CVyiYYXg6nA390AvolJME3quGN4_-sukgHrmHAszfRkPp0Cij11Xkis8u08vS-pwA/exec';

// =========================================================================================
// هام: هذا هو رابط ملف "نتائج الاختبارات" بعد مشاركته كـ "Viewer" لأي شخص لديه الرابط.
// =========================================================================================
const QUIZ_RESULTS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1kIXs3TEnBS2KYe4XPUTIz_1Sd7RL_ly5P6WeMIxoiTU/export?format=csv';


const parseCsv = (csvText: string): string[][] => {
  return csvText
    .split('\n')
    .map(row => row.trim())
    .filter(row => row)
    .slice(1) // Skip header row
    .map(row => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"' && (i === 0 || row[i-1] !== '\\')) {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim().replace(/^"|"$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^"|"$/g, ''));
      return result;
    });
};

const fetchData = async (url: string, entityName: string): Promise<string[][]> => {
    if (url.includes('ADD_YOUR') || !url) {
        console.warn(`${entityName} URL is not configured.`);
        return [];
    }
    const response = await fetch(url, { cache: 'no-store' });

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
        throw new Error(`فشل الوصول إلى ملف ${entityName}. تأكد من أن إعدادات المشاركة هي "أي شخص لديه الرابط".`);
    }

    if (!response.ok) {
        throw new Error(`فشل تحميل بيانات ${entityName}. خطأ في الشبكة أو رابط غير صحيح.`);
    }

    const csvText = await response.text();
    return parseCsv(csvText);
};


export const getStudents = async (): Promise<Student[]> => {
  try {
    const parsedData = await fetchData(STUDENTS_SHEET_URL, 'الطلاب');
    return parsedData.map(row => ({
      userId: row[0],
      studentName: row[1],
      academicYear: row[2],
    }));
  } catch (error) {
    console.error("Error fetching students:", error);
    if (error instanceof Error) {
        if (error.message.includes("فشل الوصول إلى ملف الطلاب")) {
            throw new Error('كود الطالب غير مسجل. يرجى التواصل مع الأستاذ.');
        }
        throw error;
    }
    throw new Error('حدث خطأ غير معروف أثناء جلب بيانات الطلاب.');
  }
};

export const getLectures = async (): Promise<Lecture[]> => {
  try {
    const parsedData = await fetchData(CONTENT_SHEET_URL, 'المحاضرات');
    return parsedData.map(row => ({
      lectureName: row[0],
      lectureLink: row[1],
      academicYear: row[2],
      linkType: row[3] || 'فيديو',
      thumbnailUrl: row[4],
      subject: row[5],
    }));
  } catch (error) {
    console.error("Error fetching lectures:", error);
     if (error instanceof Error) {
        throw error;
    }
    throw new Error('حدث خطأ غير معروف أثناء جلب بيانات المحاضرات.');
  }
};

export const getQuizzes = async (): Promise<Quiz[]> => {
  try {
    const parsedData = await fetchData(QUIZZES_SHEET_URL, 'الاختبارات');
    if (parsedData.length === 0) return [];
    
    const quizzesMap = new Map<string, Quiz>();
    
    parsedData.forEach(row => {
      const [academicYear, correctAnswer, opt1, opt2, opt3, opt4, questionText, quizTitle, quizId] = row;
      
      const question: Question = {
        questionText,
        options: [opt1, opt2, opt3, opt4].filter(Boolean),
        correctAnswer,
      };
      
      if (quizzesMap.has(quizId)) {
        quizzesMap.get(quizId)!.questions.push(question);
      } else {
        quizzesMap.set(quizId, {
          id: quizId,
          title: quizTitle,
          academicYear,
          questions: [question],
        });
      }
    });

    return Array.from(quizzesMap.values());
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('حدث خطأ غير معروف أثناء جلب بيانات الاختبارات.');
  }
};

export const getQuizSubmissions = async (): Promise<QuizSubmission[]> => {
    try {
        const parsedData = await fetchData(QUIZ_RESULTS_SHEET_URL, 'نتائج الاختبارات');
        if (!parsedData) return [];

        return parsedData.map(row => ({
            // Columns: Timestamp, Student ID, Student Name, Quiz Title, Score
            studentId: row[1],
            studentName: row[2],
            quizTitle: row[3],
            score: row[4],
        }));
    } catch (error) {
        console.error("Error fetching quiz submissions:", error);
        // Do not throw a fatal error, just return an empty array so the app can function.
        // The user can still take quizzes, they just won't see past results if this fails.
        return [];
    }
};


export const submitQuizResults = async (submission: QuizSubmission): Promise<{ status: string }> => {
    if (QUIZ_SUBMISSION_URL.includes('ADD_YOUR')) {
        console.error("Quiz Submission URL is not configured. Cannot submit results.");
        throw new Error("رابط إرسال النتائج غير مهيأ. يرجى التواصل مع الأستاذ.");
    }

    try {
        await fetch(QUIZ_SUBMISSION_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(submission),
        });
        
        return { status: "success" };
    } catch (error) {
        console.error("Error submitting quiz results:", error);
        throw new Error("فشل إرسال نتيجة الاختبار. يرجى المحاولة مرة أخرى.");
    }
};