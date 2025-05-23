'use client';

import ChatInterface from './components/ChatInterface';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <ChatInterface />
    </div>
  );
}
