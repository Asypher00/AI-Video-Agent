// src/components/AnalysisReport.jsx
import React from 'react';
import { CheckCircle, MessageSquare } from 'lucide-react';

function AnalysisReport({ analysis, startNewChat }) {
  return (
    <section className="mt-8 bg-green-50 p-6 rounded-2xl shadow-inner border border-green-200">
      <h2 className="text-2xl font-bold text-green-800 mb-4 flex items-center gap-2">
        <CheckCircle className="w-6 h-6" /> Analysis Report
      </h2>
      <div className="prose max-w-none text-gray-800 leading-relaxed overflow-auto max-h-[600px] bg-white p-4 rounded-lg border border-green-100">
        <pre className="whitespace-pre-wrap font-mono text-sm">{analysis}</pre>
      </div>
      <button
        onClick={startNewChat}
        className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition duration-200 flex items-center mx-auto"
      >
        <MessageSquare className="w-5 h-5 mr-2" /> Start Chat About This Analysis
      </button>
    </section>
  );
}

export default AnalysisReport;