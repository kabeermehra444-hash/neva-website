'use client';

import { useEffect, useState } from 'react';

export default function TestPage() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testApis = async () => {
      console.log('🧪 Starting API tests...');
      
      const tests = [];
      
      // Test 1: Test endpoint
      try {
        const res1 = await fetch('/api/test');
        const data1 = await res1.json();
        console.log('✅ /api/test:', data1);
        tests.push({ api: '/api/test', status: res1.status, data: data1 });
      } catch (e) {
        console.error('❌ /api/test failed:', e);
        tests.push({ api: '/api/test', error: e.message });
      }
      
      // Test 2: Products endpoint
      try {
        const res2 = await fetch('/api/products');
        console.log('📡 /api/products response status:', res2.status);
        const text2 = await res2.text();
        console.log('📦 /api/products raw response:', text2);
        let data2;
        try {
          data2 = JSON.parse(text2);
        } catch (e) {
          data2 = { parseError: e.message, raw: text2 };
        }
        console.log('✅ /api/products:', data2);
        tests.push({ api: '/api/products', status: res2.status, data: data2 });
      } catch (e) {
        console.error('❌ /api/products failed:', e);
        tests.push({ api: '/api/products', error: e.message });
      }
      
      setResults(tests);
      setLoading(false);
    };

    testApis();
  }, []);

  if (loading) return <div className="p-8">Testing APIs...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">API Test Results</h1>
      <div className="space-y-6">
        {results.map((test, i) => (
          <div key={i} className="border p-4 rounded-lg bg-gray-50">
            <h2 className="text-xl font-bold mb-2">{test.api}</h2>
            <div className="text-sm">
              <p><strong>Status:</strong> {test.status || test.error}</p>
              <pre className="mt-2 p-2 bg-white border rounded text-xs overflow-auto">
                {JSON.stringify(test.data, null, 2)}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
