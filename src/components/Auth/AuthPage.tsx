import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignUpForm } from './SignUpForm';
import { Building } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Building className="h-10 w-10 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Price Model Builder</h1>
          </div>
          <p className="text-gray-600">Professional pricing management platform</p>
        </div>

        {mode === 'login' ? (
          <LoginForm onToggleMode={() => setMode('signup')} />
        ) : (
          <SignUpForm onToggleMode={() => setMode('login')} />
        )}
      </div>
    </div>
  );
};