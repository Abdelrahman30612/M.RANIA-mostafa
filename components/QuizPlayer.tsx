import React, { useState, useMemo } from 'react';
import { Quiz, Student, QuizSubmission } from '../types';
import { submitQuizResults } from '../services/googleSheetsService';

interface QuizPlayerProps {
  quiz: Quiz;
  student: Student;
  onFinish: () => void;
}

// Helper function to shuffle an array (Fisher-Yates algorithm)
const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};


const QuizPlayer: React.FC<QuizPlayerProps> = ({ quiz, student, onFinish }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const currentQuestion = quiz.questions[currentQuestionIndex];

  // Memoize the shuffled options for the entire quiz once to keep them consistent
  const shuffledOptions = useMemo(() => {
    return quiz.questions.map(q => shuffleArray(q.options));
  }, [quiz.questions]);

  const currentShuffledOptions = shuffledOptions[currentQuestionIndex];

  const handleAnswerSelect = (answer: string) => {
    if (isSubmitted) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestionIndex]: answer,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    let calculatedScore = 0;
    quiz.questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        calculatedScore++;
      }
    });
    setScore(calculatedScore);
    setIsSubmitted(true);

    const submission: QuizSubmission = {
        studentId: student.userId,
        studentName: student.studentName,
        quizTitle: quiz.title,
        score: `${calculatedScore}/${quiz.questions.length}`
    };

    try {
        await submitQuizResults(submission);
    } catch(err) {
        if (err instanceof Error) {
            setSubmitError(err.message);
        } else {
            setSubmitError("حدث خطأ غير متوقع أثناء إرسال النتيجة.");
        }
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="w-full max-w-2xl mx-auto bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-slate-700 text-center animate-fade-in">
        <h2 className="text-3xl font-bold text-white mb-4 font-serif-display">اكتمل الاختبار!</h2>
        <p className="text-xl text-slate-300 mb-6">نتيجتك في اختبار "{quiz.title}" هي:</p>
        <p className="text-5xl font-bold text-blue-400 mb-8">
          {score} <span className="text-3xl text-slate-400">/ {quiz.questions.length}</span>
        </p>
        {isSubmitting && <p className="text-slate-400">جاري إرسال النتيجة...</p>}
        {submitError && <p className="text-red-400 bg-red-900/30 p-3 rounded-lg mt-4">{submitError}</p>}
        {!isSubmitting && !submitError && <p className="text-green-400">تم إرسال نتيجتك بنجاح!</p>}
        <button
          onClick={onFinish}
          className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300"
        >
          العودة إلى لوحة التحكم
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 md:p-8 border border-slate-700 animate-fade-in">
      <div className="mb-6 pb-4 border-b border-slate-600">
        <h2 className="text-2xl font-bold text-white font-serif-display">{quiz.title}</h2>
        <p className="text-slate-400">السؤال {currentQuestionIndex + 1} من {quiz.questions.length}</p>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-slate-200 mb-6 min-h-[60px] text-right">{currentQuestion.questionText}</h3>
        <div className="space-y-4">
          {currentShuffledOptions.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              className={`w-full text-right p-4 rounded-lg border-2 transition-all duration-200 ${
                selectedAnswers[currentQuestionIndex] === option
                  ? 'bg-blue-500 border-blue-400 text-white font-semibold'
                  : 'bg-slate-700/50 border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-slate-300'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-between items-center pt-6 border-t border-slate-600">
        <button
          onClick={handlePrev}
          disabled={currentQuestionIndex === 0}
          className="px-6 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
        >
          السابق
        </button>
        {currentQuestionIndex === quiz.questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors"
          >
            إنهاء الاختبار
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
          >
            التالي
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizPlayer;