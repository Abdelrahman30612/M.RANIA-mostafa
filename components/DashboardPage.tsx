import React, { useState, useEffect, useMemo } from 'react';
import { Student, Lecture, Quiz, QuizSubmission } from '../types';
import { getLectures, getQuizzes, getQuizSubmissions } from '../services/googleSheetsService';
import VideoPlayerModal from './VideoPlayerModal';
import QuizPlayer from './QuizPlayer';
import QuizCard from './QuizCard';

// Icons remain the same...
const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8.002v3.996a1 1 0 001.555.832l3.197-2a1 1 0 000-1.664l-3.197-2z" clipRule="evenodd" />
    </svg>
);
const FileIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-slate-500 group-hover:text-slate-400 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
);
const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);
const OpenExternalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);
const LectureCardSkeleton = () => (
    <div className="bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
        <div className="aspect-video bg-slate-700 animate-pulse"></div>
        <div className="p-4">
            <div className="h-5 bg-slate-700 rounded w-3/4 animate-pulse"></div>
        </div>
    </div>
);


type ViewMode = 'lectures' | 'quizzes';

const DashboardPage: React.FC<{ student: Student; onLogout: () => void; }> = ({ student, onLogout }) => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [submissions, setSubmissions] = useState<QuizSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playingVideoUrl, setPlayingVideoUrl] = useState<string | null>(null);
  const [activeSubject, setActiveSubject] = useState<string>('الكل');
  const [currentView, setCurrentView] = useState<ViewMode>('lectures');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [allLectures, allQuizzes, allSubmissions] = await Promise.all([
            getLectures(), 
            getQuizzes(),
            getQuizSubmissions()
        ]);
        
        const studentLectures = allLectures.filter(lec => lec.academicYear === student.academicYear);
        const studentQuizzes = allQuizzes.filter(quiz => quiz.academicYear === student.academicYear);
        const studentSubmissions = allSubmissions.filter(sub => sub.studentId === student.userId);
        
        setLectures(studentLectures);
        setQuizzes(studentQuizzes);
        setSubmissions(studentSubmissions);

      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('حدث خطأ غير متوقع أثناء تحميل المحتوى.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [student.academicYear, student.userId]);

  // Memoized calculations for lectures
  const subjects = useMemo(() => {
    if (lectures.length === 0) return [];
    const uniqueSubjects = new Set(lectures.map(l => l.subject).filter((s): s is string => Boolean(s)));
    return ['الكل', ...Array.from(uniqueSubjects)];
  }, [lectures]);

  const filteredLectures = useMemo(() => {
    if (activeSubject === 'الكل') return lectures;
    return lectures.filter(lecture => lecture.subject === activeSubject);
  }, [lectures, activeSubject]);
  
  // URL helpers
  const getEmbedUrl = (url: string): string | null => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes('youtube.com')) {
        const videoId = urlObj.searchParams.get('v');
        if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      } else if (urlObj.hostname === 'youtu.be') {
        const videoId = urlObj.pathname.substring(1);
        if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      } else if (urlObj.hostname === 'drive.google.com') {
          const pathParts = urlObj.pathname.split('/');
          const fileIdIndex = pathParts.findIndex(part => part === 'd');
          if (fileIdIndex !== -1 && pathParts.length > fileIdIndex + 1) {
              const fileId = pathParts[fileIdIndex + 1];
              // Using /preview is the most reliable method to avoid playback and virus scan issues.
              return `https://drive.google.com/file/d/${fileId}/preview`;
          }
      }
    } catch (error) {
        console.error("Invalid or unsupported URL:", url, error);
        return null;
    }
    return url;
  };

  const getDownloadUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'drive.google.com') {
          const pathParts = urlObj.pathname.split('/');
          const fileIdIndex = pathParts.findIndex(part => part === 'd');
          if (fileIdIndex !== -1 && pathParts.length > fileIdIndex + 1) {
              const fileId = pathParts[fileIdIndex + 1];
              return `https://drive.google.com/uc?export=download&id=${fileId}`;
          }
      }
    } catch (error) {
        console.error("Invalid URL for download:", url, error);
    }
    return url;
  };

  const handleLectureClick = (lecture: Lecture) => {
    if (lecture.linkType.toLowerCase().trim() === 'فيديو') {
      const embedUrl = getEmbedUrl(lecture.lectureLink);
      if (embedUrl) {
          setPlayingVideoUrl(embedUrl);
      } else {
          alert('رابط الفيديو غير صالح.');
      }
    }
  };

  const closePlayer = () => setPlayingVideoUrl(null);
  
  const handleQuizFinish = () => {
    // Refetch submissions to update the UI instantly after a quiz is taken.
    getQuizSubmissions().then(allSubmissions => {
        const studentSubmissions = allSubmissions.filter(sub => sub.studentId === student.userId);
        setSubmissions(studentSubmissions);
    });
    setSelectedQuiz(null);
  }

  if (selectedQuiz) {
    return <QuizPlayer quiz={selectedQuiz} student={student} onFinish={handleQuizFinish} />;
  }


  return (
    <div className="w-full animate-fade-in">
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-700">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white font-serif-display">
            أهلاً بك، <span className="text-blue-400">{student.studentName}</span>
          </h1>
          <p className="text-slate-400">المحتوى الدراسي المتاح لـ <span className="font-semibold text-slate-300">{student.academicYear}</span></p>
        </div>
        <button
          onClick={onLogout}
          className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          تسجيل الخروج
        </button>
      </header>
      
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-slate-700">
        <div className="flex border-b border-slate-600 mb-6">
            <button onClick={() => setCurrentView('lectures')} className={`px-6 py-3 font-semibold transition-colors duration-300 ${currentView === 'lectures' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'}`}>المحاضرات</button>
            <button onClick={() => setCurrentView('quizzes')} className={`px-6 py-3 font-semibold transition-colors duration-300 ${currentView === 'quizzes' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-white'}`}>الاختبارات</button>
        </div>
        
        {error && <p className="text-center text-red-400 bg-red-900/30 p-3 rounded-lg">{error}</p>}
        
        {isLoading && (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, index) => <LectureCardSkeleton key={index} />)}
            </div>
        )}

        {!isLoading && !error && (
        <div className="animate-fade-in">
            {currentView === 'lectures' && (
                <>
                    {subjects.length > 1 && (
                        <div className="mb-6 flex flex-wrap gap-3 items-center border-b border-slate-700 pb-4">
                            <h2 className="text-slate-300 font-semibold ml-2">المادة:</h2>
                            {subjects.map(subject => (
                                <button key={subject} onClick={() => setActiveSubject(subject)} className={`px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${activeSubject === subject ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>
                                    {subject}
                                </button>
                            ))}
                        </div>
                    )}
                    {filteredLectures.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredLectures.map((lecture, index) => {
                            const isVideo = lecture.linkType.toLowerCase().trim() === 'فيديو';
                            if (isVideo) {
                                return (
                                    <div key={index} onClick={() => handleLectureClick(lecture)} className="group block bg-slate-900 rounded-lg border border-slate-700 overflow-hidden shadow-lg hover:shadow-blue-500/30 hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                                        <div className="relative aspect-video bg-slate-800/70 flex items-center justify-center">
                                            {lecture.thumbnailUrl ? <img src={lecture.thumbnailUrl} alt={lecture.lectureName} className="w-full h-full object-cover" /> : <PlayIcon />}
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"><PlayIcon /></div>
                                            <span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs font-bold py-1 px-2 rounded">محاضرة</span>
                                        </div>
                                        <div className="p-4"><h3 className="font-semibold text-white truncate group-hover:text-blue-400 transition-colors">{lecture.lectureName}</h3></div>
                                    </div>);
                            } else {
                                const openUrl = lecture.lectureLink;
                                const downloadUrl = getDownloadUrl(lecture.lectureLink);
                                return (
                                    <div key={index} className="group bg-slate-900 rounded-lg border border-slate-700 overflow-hidden shadow-lg transition-all duration-300 flex flex-col">
                                        <div className="relative aspect-video bg-slate-800/70 flex items-center justify-center"><FileIcon /><span className="absolute bottom-2 left-2 bg-black/60 text-white text-xs font-bold py-1 px-2 rounded">ملف</span></div>
                                        <div className="p-4 flex flex-col flex-grow justify-between">
                                            <h3 className="font-semibold text-white truncate mb-3">{lecture.lectureName}</h3>
                                            <div className="flex items-center justify-end space-x-3">
                                                <a href={openUrl} target="_blank" rel="noopener noreferrer" title="فتح الملف" className="text-slate-400 hover:text-blue-400 transition-colors p-2 rounded-full hover:bg-slate-700"><OpenExternalIcon /></a>
                                                <a href={downloadUrl} download={lecture.lectureName} title="تحميل الملف" className="text-slate-400 hover:text-green-400 transition-colors p-2 rounded-full hover:bg-slate-700"><DownloadIcon /></a>
                                            </div>
                                        </div>
                                    </div>);
                            }
                        })}
                        </div>
                    ) : (<p className="text-center text-slate-400 py-8">{lectures.length > 0 ? 'لا يوجد محتوى لهذه المادة.' : 'لا توجد محاضرات متاحة لهذه السنة الدراسية حتى الآن.'}</p>)}
                </>
            )}
            {currentView === 'quizzes' && (
                <>
                    {quizzes.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {quizzes.map(quiz => {
                                const submission = submissions.find(s => s.quizTitle === quiz.title);
                                return <QuizCard key={quiz.id} quiz={quiz} submission={submission} onStart={() => setSelectedQuiz(quiz)} />
                            })}
                        </div>
                    ) : (
                        <p className="text-center text-slate-400 py-8">لا توجد اختبارات متاحة لهذه السنة الدراسية حتى الآن.</p>
                    )}
                </>
            )}
        </div>
        )}
      </div>

      {playingVideoUrl && <VideoPlayerModal videoUrl={playingVideoUrl} onClose={closePlayer} />}
    </div>
  );
};

export default DashboardPage;