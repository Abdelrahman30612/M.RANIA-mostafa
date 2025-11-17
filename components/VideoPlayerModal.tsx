import React, { useEffect } from 'react';

interface VideoPlayerModalProps {
  videoUrl: string;
  onClose: () => void;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ videoUrl, onClose }) => {
  // Close modal on 'Escape' key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in-fast"
      onClick={onClose} // Close on backdrop click
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-slate-900 rounded-lg shadow-2xl w-full max-w-4xl aspect-video relative m-4 overflow-hidden border border-slate-700"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal content
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white bg-black/50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors z-10"
          aria-label="إغلاق"
        >
          ✕
        </button>
        <iframe
          className="w-full h-full"
          src={videoUrl}
          title="مشغل الفيديو"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>
    </div>
  );
};

export default VideoPlayerModal;