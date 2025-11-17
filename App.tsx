import React, { useState, useCallback } from 'react';
import { Student } from './types';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import { getStudents } from './services/googleSheetsService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  
  const handleLogin = useCallback(async (userId: string): Promise<void> => {
    const students = await getStudents();
    const foundStudent = students.find(s => s.userId.toLowerCase() === userId.toLowerCase());
    
    if (foundStudent) {
      setCurrentUser(foundStudent);
    } else {
      throw new Error('الكود غير صحيح، يرجى التواصل مع الأستاذ.');
    }
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-4">
       <main className="w-full max-w-5xl z-10 py-8 flex-grow">
        {currentUser ? (
          <DashboardPage student={currentUser} onLogout={handleLogout} />
        ) : (
          <div className="flex items-center justify-center min-h-[80vh]">
            <LoginPage onLogin={handleLogin} />
          </div>
        )}
       </main>
       <footer className="w-full text-center z-10 pb-2">
         <p className="text-xs text-slate-500">تم إنشاؤه بواسطة عبدالرازق</p>
       </footer>
    </div>
  );
};

export default App;