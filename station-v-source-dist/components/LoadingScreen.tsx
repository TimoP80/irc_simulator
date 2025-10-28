import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  progress: number;
  message: string;
  isComplete?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress, message, isComplete = false }) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    // Smooth animation for progress bar
    const animationDuration = 300; // ms - faster animation
    const startProgress = animatedProgress;
    const endProgress = progress;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progressRatio = Math.min(elapsed / animationDuration, 1);
      const currentProgress = startProgress + (endProgress - startProgress) * progressRatio;

      setAnimatedProgress(currentProgress);

      if (progressRatio < 1) {
        requestAnimationFrame(animate);
      }
    };

    // Only animate if there's a change
    if (startProgress !== endProgress) {
      requestAnimationFrame(animate);
    }
  }, [progress, animatedProgress]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-mono">
      {/* Logo/Title */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-cyan-400 mb-2">
          Station V
        </h1>
        <p className="text-lg text-gray-400">
          Virtual IRC Simulator
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-80 mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Initializing...</span>
          <span>{Math.round(animatedProgress)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ease-out ${
              isComplete ? 'bg-green-500' : 'bg-cyan-500'
            }`}
            style={{ width: `${animatedProgress}%` }}
          />
        </div>
      </div>

      {/* Status Message */}
      <div className="text-center">
        <p className="text-lg text-gray-300 mb-2">{message}</p>
        {!isComplete && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-400">Please wait...</span>
          </div>
        )}
      </div>

      {/* Loading Animation */}
      {!isComplete && (
        <div className="mt-8 flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      )}

      {/* Completion Message */}
      {isComplete && (
        <div className="mt-8 text-center">
          <div className="text-green-400 text-xl mb-2">✓</div>
          <p className="text-green-400">Ready to chat!</p>
        </div>
      )}
    </div>
  );
};

export default LoadingScreen;