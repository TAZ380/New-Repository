import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthForm } from './components/auth/AuthForm';
import { NurseProfileCompletion } from './components/profile/NurseProfileCompletion';
import { DocumentUpload } from './components/documents/DocumentUpload';
import { NurseDashboard } from './components/dashboard/NurseDashboard';
import { CompanyDashboard } from './components/dashboard/CompanyDashboard';
import { JobListings } from './components/jobs/JobListings';
import ShiftManagement from './components/shifts/ShiftManagement';
import { BottomNav } from './components/navigation/BottomNav';
import { TopNav } from './components/navigation/TopNav';
import { ProfilePage } from './components/profile/ProfilePage';
import { ProfileEditor } from './components/profile/ProfileEditor';
import { ContractHistory } from './components/contracts/ContractHistory';
import { EarningsPage } from './components/earnings/EarningsPage';
import { ChevronRight } from 'lucide-react';
import { supabase } from './lib/supabase';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAuthPage = ['/login', '/register'].includes(location.pathname);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Show TopNav only when authenticated */}
      {!isAuthPage && <TopNav onMenuClick={() => setShowMenu(true)} />}

      {/* Menu Overlay */}
      {showMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div 
            ref={menuRef}
            className="absolute left-4 top-20 w-64 bg-white rounded-lg shadow-xl transform transition-all duration-200 ease-out origin-top-left"
            style={{
              opacity: showMenu ? 1 : 0,
              transform: showMenu ? 'scale(1)' : 'scale(0.95)'
            }}
          >
            <ul className="py-2">
              <li>
                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center justify-between p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="font-medium">Mi Perfil</span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center justify-between p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="font-medium">Configuración</span>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center justify-between p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <span className="font-medium">Cerrar sesión</span>
                  <ChevronRight className="h-5 w-5 text-red-400" />
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
        isAuthPage ? 'py-12' : 'pt-24 pb-20'
      } ${
        isAuthPage ? 'flex items-center justify-center min-h-[calc(100vh-4rem)]' : ''
      }`}>
        <Routes>
          <Route path="/login" element={<AuthForm type="login" />} />
          <Route path="/register" element={<AuthForm type="register" />} />
          <Route path="/complete-profile" element={<NurseProfileCompletion />} />
          <Route path="/upload-documents" element={<DocumentUpload />} />
          <Route path="/dashboard" element={<NurseDashboard />} />
          <Route path="/company/dashboard" element={<CompanyDashboard />} />
          <Route path="/jobs" element={<JobListings />} />
          <Route path="/shifts" element={<ShiftManagement />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<ProfileEditor />} />
          <Route path="/contracts" element={<ContractHistory />} />
          <Route path="/earnings" element={<EarningsPage />} />
          <Route path="/vademecum" element={<div>Vademécum</div>} />
          <Route path="/courses" element={<div>Formación</div>} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>

      {/* Show BottomNav only when authenticated */}
      {!isAuthPage && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;