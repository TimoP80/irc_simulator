import React from 'react';

interface ProfilePictureProps {
  user: {
    nickname: string;
    profilePicture?: string;
    userType?: 'virtual' | 'bot';
  };
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ProfilePicture: React.FC<ProfilePictureProps> = ({ 
  user, 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-lg'
  };

  const getInitials = (nickname: string) => {
    return nickname
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getBackgroundColor = (nickname: string, userType?: string) => {
    // Generate consistent color based on nickname
    const colors = [
      'bg-red-500',
      'bg-blue-500', 
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < nickname.length; i++) {
      hash = nickname.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  if (user.profilePicture) {
    return (
      <div className={`${sizeClasses[size]} ${className} rounded-full overflow-hidden flex-shrink-0`}>
        <img
          src={user.profilePicture}
          alt={`${user.nickname}'s profile`}
          className="w-full h-full object-cover"
          key={user.profilePicture} // Force re-render when URL changes
          onError={(e) => {
            // Fallback to initials if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = `
                <div class="w-full h-full flex items-center justify-center ${getBackgroundColor(user.nickname, user.userType)} text-white font-semibold ${textSizeClasses[size]}">
                  ${getInitials(user.nickname)}
                </div>
              `;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} ${className} rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center ${getBackgroundColor(user.nickname, user.userType)} text-white font-semibold ${textSizeClasses[size]}`}>
      {getInitials(user.nickname)}
    </div>
  );
};
