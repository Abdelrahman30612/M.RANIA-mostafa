import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (userId: string) => Promise<void>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      setError('يرجى إدخال الكود الخاص بك.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await onLogin(userId);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('حدث خطأ غير متوقع.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
        <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-blue-500/10 p-8 border border-slate-700">
            <div className="text-center mb-8">
                <img src="https://i.ibb.co/gbrTzc9v/image.png" alt="M. Rania Mustafa Logo" className="mx-auto mb-4 h-28 w-auto" />
                <p className="text-slate-400">أدخل الكود الخاص بك للوصول الى محتواك الدراسى</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="userId" className="block text-sm font-medium text-slate-300 mb-2">
                        الكود الخاص بك
                    </label>
                    <input
                        id="userId"
                        type="text"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="202300"
                        className="w-full px-4 py-3 bg-slate-900/80 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-300"
                        disabled={isLoading}
                    />
                </div>
                
                {error && <p className="text-red-400 text-sm text-center bg-red-900/30 p-3 rounded-lg">{error}</p>}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500"
                >
                    {isLoading ? (
                        <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            جار التحقق...
                        </div>
                    ) : (
                        'دخول'
                    )}
                </button>
            </form>
        </div>
    </div>
  );
};

export default LoginPage;
