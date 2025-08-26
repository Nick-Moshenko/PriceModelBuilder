import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AuthPage } from './AuthPage';
import { MFAChallenge } from './MFAChallenge';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !session) {
    return <AuthPage />;
  }

  // Check if MFA is required but not completed
  const mfaLevel = session.aal;
  if (mfaLevel === 'aal1' && user.factors && user.factors.length > 0) {
    return <MFAChallenge />;
  }

  return <>{children}</>;
};