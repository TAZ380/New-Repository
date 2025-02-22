import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Syringe,
  Briefcase,
  Home,
  Calendar,
  GraduationCap
} from 'lucide-react';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Vademécum */}
          <button
            onClick={() => navigate('/vademecum')}
            className={`flex flex-col items-center justify-center w-16 h-16 ${
              location.pathname === '/vademecum' 
                ? 'text-blue-600' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <Syringe size={24} />
            <span className="text-xs mt-1">Vademécum</span>
          </button>

          {/* Ofertas */}
          <button
            onClick={() => navigate('/jobs')}
            className={`flex flex-col items-center justify-center w-16 h-16 ${
              location.pathname === '/jobs' 
                ? 'text-blue-600' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <Briefcase size={24} />
            <span className="text-xs mt-1">Ofertas</span>
          </button>

          {/* Inicio (centered with special styling) */}
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex flex-col items-center justify-center w-16 h-16 relative ${
              location.pathname === '/dashboard' 
                ? 'text-blue-600' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <div className="absolute -top-4 bg-blue-600 rounded-full p-3">
              <Home size={24} className="text-white" />
            </div>
            <span className="text-xs mt-6">Inicio</span>
          </button>

          {/* Turnos */}
          <button
            onClick={() => navigate('/shifts')}
            className={`flex flex-col items-center justify-center w-16 h-16 ${
              location.pathname === '/shifts' 
                ? 'text-blue-600' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <Calendar size={24} />
            <span className="text-xs mt-1">Turnos</span>
          </button>

          {/* Formación */}
          <button
            onClick={() => navigate('/courses')}
            className={`flex flex-col items-center justify-center w-16 h-16 ${
              location.pathname === '/courses' 
                ? 'text-blue-600' 
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <GraduationCap size={24} />
            <span className="text-xs mt-1">Formación</span>
          </button>
        </div>
      </div>
    </nav>
  );
}