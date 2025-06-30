// src/components/ChatInterface.jsx
import React, { useRef, useEffect } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';

function ChatInterface({ chatMessages, chatInput, setChatInput, sendChatMessage, chatLoading, getQuickActions }) {
  const chatEndRef = useRef(null);

  // Auto-scroll chat to the bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  return (
    <section className="mt-8 bg-gray-50 p-6 rounded-2xl shadow-inner border border-gray-200 flex flex-col h-[500px]">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <MessageSquare className="w-6 h-6" /> Chat with AI Inspector
      </h2>
      <div className="flex-grow overflow-y-auto p-4 border border-gray-300 rounded-lg bg-white mb-4 space-y-4 shadow-sm">
        {chatMessages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] p-3 rounded-lg shadow-md ${
                msg.role === 'user'
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}
            >
              <p className="font-semibold text-sm mb-1">
                {msg.role === 'user' ? 'You' : 'AI Inspector'}
              </p>
              <p>{msg.content}</p>
              <p className="text-xs opacity-75 mt-1">
                {msg.timestamp === 'streaming' ? 'Typing...' : new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        {chatLoading && (
          <div className="flex justify-start">
            <div className="max-w-[70%] p-3 rounded-lg shadow-md bg-gray-200 text-gray-800 rounded-bl-none">
              <p className="font-semibold text-sm mb-1">AI Inspector</p>
              <Loader2 className="animate-spin w-5 h-5 text-gray-600" />
              <p className="text-xs opacity-75 mt-1">Thinking...</p>
            </div>
          </div>
        )}
        <div ref={chatEndRef} /> {/* For auto-scrolling */}
      </div>

      {getQuickActions().length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
              {getQuickActions().map((action, index) => (
                  <button
                      key={index}
                      onClick={() => setChatInput(action)}
                      className="px-4 py-2 text-sm bg-gray-200 rounded-full text-gray-700 hover:bg-gray-300 transition"
                  >
                      {action}
                  </button>
              ))}
          </div>
      )}

      <form onSubmit={sendChatMessage} className="flex gap-3">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Ask a question about the analysis..."
          className="flex-grow p-3 border border-gray-300 rounded-xl focus:ring-emerald-500 focus:border-emerald-500 shadow-sm transition duration-150"
          disabled={chatLoading}
        />
        <button
          type="submit"
          className={`px-6 py-3 rounded-xl font-semibold transition duration-200 flex items-center ${
            !chatInput.trim() || chatLoading
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-md'
          }`}
          disabled={!chatInput.trim() || chatLoading}
        >
          <MessageSquare className="w-5 h-5 mr-2" /> Send
        </button>
      </form>
    </section>
  );
}

export default ChatInterface;