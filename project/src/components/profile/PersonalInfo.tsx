import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ChevronRight } from 'lucide-react';

interface PersonalInfoProps {
  profile: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  onUpdate: () => void;
}

export function PersonalInfo({ profile, onUpdate }: PersonalInfoProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/profile/edit')}
      className="w-full bg-[#E3F2FD] hover:bg-[#BBDEFB] text-blue-800 transition-all rounded-xl overflow-hidden shadow-md hover:shadow-lg group"
    >
      <div className="p-6">
        <div className="flex items-center gap-6">
          {/* Profile Image */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-white">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-100">
                  <User className="h-10 w-10 text-blue-600" />
                </div>
              )}
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-left">
            <h3 className="text-xl font-semibold">{profile.full_name}</h3>
          </div>

          {/* Arrow Icon */}
          <ChevronRight className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </button>
  );
}