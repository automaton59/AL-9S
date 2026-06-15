import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-4 text-center">
          AL-1S
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Your AI Companion
        </p>
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-6 border border-pink-200">
          <p className="text-gray-700 text-center">
            Welcome! I'm here to chat with you.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
