'use client';

import { useState } from 'react';
import { testBackendConnections, testCreateOperations } from '@/lib/test-connections';

export default function TestPage() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, message]);
  };

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    
    addResult('🚀 Starting backend connection tests...');
    
    // Override console.log to capture results
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (message: string, ...args: any[]) => {
      addResult(`${message} ${args.join(' ')}`);
      originalLog(message, ...args);
    };
    
    console.error = (message: string, ...args: any[]) => {
      addResult(`❌ ${message} ${args.join(' ')}`);
      originalError(message, ...args);
    };

    try {
      const connectionTest = await testBackendConnections();
      
      if (connectionTest) {
        addResult('✅ Basic connection tests passed!');
        addResult('🧪 Running create operation tests...');
        const createTest = await testCreateOperations();
        
        if (createTest) {
          addResult('🎉 All tests passed successfully!');
        } else {
          addResult('❌ Create operation tests failed');
        }
      } else {
        addResult('❌ Basic connection tests failed');
      }
    } catch (error) {
      addResult(`❌ Test execution failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // Restore console functions
      console.log = originalLog;
      console.error = originalError;
      setTesting(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Backend Connection Tests</h1>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          This page tests the connection between the frontend and backend API.
          Make sure the backend is running on http://localhost:3000 before running tests.
        </p>
        
        <button
          onClick={runTests}
          disabled={testing}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Run Tests'}
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg min-h-[400px]">
        <h2 className="text-xl font-semibold mb-4">Test Results:</h2>
        
        {results.length === 0 && !testing && (
          <p className="text-gray-500">Click "Run Tests" to start testing the backend connection.</p>
        )}
        
        {testing && results.length === 0 && (
          <p className="text-blue-500">Initializing tests...</p>
        )}
        
        <div className="font-mono text-sm space-y-1">
          {results.map((result, index) => (
            <div key={index} className="whitespace-pre-wrap">
              {result}
            </div>
          ))}
        </div>
        
        {testing && (
          <div className="mt-4 text-blue-500">
            <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
            Running tests...
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">Troubleshooting:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Make sure the backend is running: <code>cd back-api && npm run dev</code></li>
          <li>Backend should be accessible at: <code>http://localhost:3000</code></li>
          <li>Database should be connected and migrated</li>
          <li>Check browser console for detailed error messages</li>
        </ul>
      </div>
    </div>
  );
}