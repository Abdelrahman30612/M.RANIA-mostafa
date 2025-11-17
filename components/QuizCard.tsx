import React from 'react';
import { Quiz, QuizSubmission } from '../types';

interface QuizCardProps {
  quiz: Quiz;
  submission?: QuizSubmission;
  onStart: () => void;
}

const QuizIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);


const QuizCard: React.FC<QuizCardProps> = ({ quiz, submission, onStart }) => {
  const hasSubmitted = !!submission;

  return (
    <div className={`bg-slate-900 rounded-lg border border-slate-700 overflow-hidden shadow-lg transition-all duration-300 flex flex-col p-5 ${hasSubmitted ? 'bg-slate-900/50' : ''}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <QuizIcon />
        </div>
        <div className="flex-grow">
          <h3 className="font-semibold text-white text-lg truncate mb-1">
            {quiz.title}
          </h3>
          <p className="text-sm text-slate-400">
            {quiz.questions.length} أسئلة
          </p>
        </div>
      </div>
      <div className="mt-auto pt-4">
         {hasSubmitted ? (
            <div className="text-center bg-slate-800/50 py-2 rounded-lg">
                <p className="font-bold text-green-400">مكتمل</p>
                <p className="text-sm text-slate-300 mt-1">
                نتيجتك: <span className="font-bold text-white">{submission.score}</span>
                </p>
            </div>
         ) : (
            <button 
                onClick={onStart}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 transform hover:scale-105"
            >
                ابدأ الاختبار
            </button>
         )}
      </div>
    </div>
  );
};

export default QuizCard;