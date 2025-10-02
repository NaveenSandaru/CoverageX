"use client";
import React, { useState, useEffect, useContext } from 'react';
import { ChevronLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { AuthContext } from '@/context/auth-context';

interface SecurityQuestion {
  id: number;
  question: string;
}

const ChangePassword = () => {
  const { setUser, setAccessToken } = useContext(AuthContext);
  const [currentStep, setCurrentStep] = useState('securityQuestions');
  const [email, setEmail] = useState('');
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<(number | null)[]>([null, null, null]); // Array for 3 questions
  const [answers, setAnswers] = useState<string[]>(['', '', '']); // Array for 3 answers
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  // Get email from URL when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const emailFromUrl = params.get('email');
      if (emailFromUrl) {
        setEmail(emailFromUrl);
      }
    }
  }, []);

  // Fetch all 10 security questions from database
  useEffect(() => {
    if (currentStep === 'securityQuestions') {
      fetchSecurityQuestions();
    }
  }, [currentStep]);

  const fetchSecurityQuestions = async () => {
    setLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${baseUrl}/security-questions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch security questions');
      }

      const data = await response.json();
      
      // Transform the data to match the expected format
      const questions = Array.isArray(data) ? data : data.data || [];
      const formattedQuestions = questions.map((q: { question_id: number; question: string }) => ({
        id: q.question_id,
        question: q.question
      }));

      setSecurityQuestions(formattedQuestions);
    } catch (err) {
      console.error('Error fetching security questions:', err);
      setError('Failed to load security questions. Please try again.');
      // Set some default questions as fallback
      setSecurityQuestions([
        { id: 1, question: "What was the name of your first pet?" },
        { id: 2, question: "In which city were you born?" },
        { id: 3, question: "What is your mother's maiden name?" },
        { id: 4, question: "What was the name of your elementary school?" },
        { id: 5, question: "What is your favorite movie?" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSelect = (questionIndex: number, questionId: number | null) => {
    const newSelectedQuestions = [...selectedQuestions];
    newSelectedQuestions[questionIndex] = questionId;
    setSelectedQuestions(newSelectedQuestions);
  };

  const handleAnswerChange = (answerIndex: number, answer: string) => {
    const newAnswers = [...answers];
    newAnswers[answerIndex] = answer;
    setAnswers(newAnswers);
  };

  const verifySecurityQuestions = async () => {
    if (!email.trim()) {
      toast.error("Email Required", {
        description: "Please enter your email address before proceeding."
      });
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      
      // Fetch the stored questions and answers for the client
      const endpoint = `/service-provider-questions/${encodeURIComponent(email)}`;

      console.log('Fetching from endpoint:', `${baseUrl}${endpoint}`);

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch security questions');
      }

      const storedAnswers = await response.json();
      
      console.log('Selected Questions:', selectedQuestions);
      console.log('Provided Answers:', answers);
      console.log('Stored Answers from DB:', storedAnswers);

      // Verify if the provided answers match the stored answers
      const isVerified = selectedQuestions.every((questionId, index) => {
        const storedQuestion = storedAnswers.find(
          (q: { question_id: string | number; answer: string }) => 
          String(q.question_id) === String(questionId)
        );
        
        console.log(`Comparing Q${index + 1}:`, {
          questionId,
          providedAnswer: answers[index].toLowerCase(),
          storedAnswer: storedQuestion?.answer?.toLowerCase(),
          matches: storedQuestion && storedQuestion.answer.toLowerCase() === answers[index].toLowerCase()
        });
        
        return storedQuestion && storedQuestion.answer.toLowerCase().trim() === answers[index].toLowerCase().trim();
      });

      console.log('Verification result:', isVerified);

      if (isVerified) {
        console.log('Security questions verified successfully');
        toast.success("Questions Verified", {
          description: "Security questions verified successfully. You can now reset your password."
        });
        setCurrentStep('resetPassword');
      } else {
        throw new Error('Incorrect answers provided');
      }
      
    } catch (err) {
      console.error('Error verifying security questions:', err);
      toast.error("Verification Failed", {
        description: "The answers provided do not match our records. Please try again."
      });
      setError('The answers provided do not match our records. Please check your answers and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Password Mismatch", {
        description: "Passwords do not match. Please try again."
      });
      setError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error("Invalid Password", {
        description: "Password must be at least 8 characters long."
      });
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/service-providers/`,
        {
          email: email,
          password: newPassword
        }
      );

      if (response.status === 200) {
        toast.success("Password Changed Successfully", {
          description: "Please log in with your new password"
        });
        
        // Log out the user
        try {
          await axios.delete(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/delete_token`,
            { withCredentials: true }
          );
          
          // Clear user context
          setUser(null);
          setAccessToken("");
          
          // Set success state and redirect after a short delay
          setCurrentStep('success');
          setTimeout(() => {
            router.push('/auth/login');
          }, 2000);
        } catch (logoutError) {
          console.error('Error during logout:', logoutError);
          // Still redirect to login even if logout fails
          router.push('/auth/login');
        }
      }
    } catch (err: any) {
      console.error('Error resetting password:', err);
      toast.error("Password Reset Failed", {
        description: err.response?.data?.error || "An error occurred while resetting your password"
      });
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    // Reset all state and navigate back to login
    setCurrentStep('securityQuestions');
    setSelectedQuestions([null, null, null]);
    setAnswers(['', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    router.push("/auth/login");
  };

  const renderSecurityQuestions = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Questions</h2>
          <p className="text-gray-600">Please select and answer three security questions to reset your password.</p>
          <p className="text-sm text-gray-500 mt-2">Email: {email}</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        <div className="space-y-6 mb-8">
          {[1, 2, 3].map((questionNumber, index) => (
            <div key={questionNumber} className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Question {questionNumber}
              </label>
              
              <select
                value={selectedQuestions[index] || ''}
                onChange={(e) => handleQuestionSelect(index, parseInt(e.target.value) || null)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
              >
                <option value="">Select a security question</option>
                {securityQuestions.map((question) => {
                  // Disable question if it's already selected in another dropdown
                  const isAlreadySelected = selectedQuestions.includes(question.id) && selectedQuestions[index] !== question.id;
                  return (
                    <option 
                      key={question.id} 
                      value={question.id}
                      disabled={isAlreadySelected}
                    >
                      {question.question}
                    </option>
                  );
                })}
              </select>
              
              <input
                type="text"
                placeholder="Enter your answer"
                value={answers[index] || ''}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                disabled={!selectedQuestions[index]}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          ))}
        </div>
        
        <div className="flex space-x-4">
          <Link href="/auth/login" className="flex-1">
            <button className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-2">
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>
          </Link>
          
          <button
            onClick={verifySecurityQuestions}
            disabled={
              selectedQuestions.some(q => q === null) || 
              answers.some(a => !a?.trim()) ||
              loading
            }
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Verifying...' : 'Verify Security Questions'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderPasswordReset = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Lock className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Password</h2>
          <p className="text-gray-600">Enter your new password</p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        
        <div className="space-y-4 mb-6">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={handlePasswordReset}
            disabled={!newPassword || !confirmPassword || loading}
            className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
          
          <button
            onClick={() => setCurrentStep('securityQuestions')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Password Reset Successful!</h2>
        <p className="text-gray-600 mb-8">Your password has been successfully reset. You can now log in with your new password.</p>
        
        <button
          onClick={handleBackToLogin}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
        >
          Back to Login
        </button>
      </div>
    </div>
  );

  // Render current step
  switch (currentStep) {
    case 'securityQuestions':
      return renderSecurityQuestions();
    case 'resetPassword':
      return renderPasswordReset();
    case 'success':
      return renderSuccess();
    default:
      return renderSecurityQuestions();
  }
};

export default ChangePassword;