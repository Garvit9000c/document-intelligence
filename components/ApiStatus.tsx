'use client';

import { useState, useEffect } from 'react';
import { Globe, TestTube } from 'lucide-react';

export default function ApiStatus() {
  const [isRealApi, setIsRealApi] = useState(false);

  useEffect(() => {
    setIsRealApi(process.env.NEXT_PUBLIC_USE_REAL_API === 'true');
  }, []);

  return (
    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${
      isRealApi 
        ? 'bg-green-100 text-green-700 border border-green-200' 
        : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
    }`}>
      {isRealApi ? (
        <>
          <Globe className="w-3 h-3" />
          <span>Document Intelligence API</span>
        </>
      ) : (
        <>
          <TestTube className="w-3 h-3" />
          <span>Demo Mode</span>
        </>
      )}
    </div>
  );
}
