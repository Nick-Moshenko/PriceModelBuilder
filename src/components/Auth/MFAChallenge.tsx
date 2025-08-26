import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';

export const MFAChallenge: React.FC = () => {
  const { challengeMFA, verifyMFAChallenge, getMFAFactors } = useAuth();
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [factorId, setFactorId] = useState('');

  useEffect(() => {
    const initChallenge = async () => {
      try {
        const factors = await getMFAFactors();
        if (factors.length > 0) {
          const factor = factors[0]; // Use first available factor
          setFactorId(factor.id);
          const challengeId = await challengeMFA(factor.id);
          setChallengeId(challengeId);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to initialize 2FA challenge');
      }
    };

    initChallenge();
  }, [challengeMFA, getMFAFactors]);

  const handleVerify = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await verifyMFAChallenge(challengeId, verificationCode);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h2>
            <p className="text-gray-600 mt-2">
              Enter the verification code from your authenticator app
            </p>
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-6">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-red-700">{error}</span>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono tracking-widest"
                placeholder="000000"
                maxLength={6}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1 text-center">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <button
              onClick={handleVerify}
              disabled={loading || verificationCode.length !== 6}
              className="w-full flex items-center justify-center py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};