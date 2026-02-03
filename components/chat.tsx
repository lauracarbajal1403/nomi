"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles } from 'lucide-react';

// Utility for safe ID generation
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  // Initial Greeting
  useEffect(() => {
    if (messages.length === 0) {
      const timer = setTimeout(() => {
        addBotMessage(
          "¡Hola! Soy Nominik 👋, tu asistente virtual de Nommy. Estoy aquí para ayudarte con cualquier pregunta sobre nómina, RRHH o lo que necesites. ¿En qué puedo ayudarte hoy?"
        );
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  const addBotMessage = (text) => {
    setMessages(prev => [...prev, { id: generateId(), role: "bot", text }]);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { id: generateId(), role: "user", text }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    addUserMessage(userMessage);
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const response = await fetch('/api/nomi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...conversationHistory,
            { role: 'user', content: userMessage },
          ],
        }),
      });

      if (!response.ok) throw new Error('Network response was not ok');

      const data = await response.json();
      addBotMessage(data.text);

    } catch (error) {
      console.error("Chat Error:", error);
      addBotMessage('Disculpa, hubo un error al procesar tu mensaje. ¿Podrías intentarlo de nuevo?');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-[100dvh] bg-gradient-to-br from-gray-50 via-white to-gray-50">
      
      {/* Modern Header with Glassmorphism */}
      <div className="relative backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm shrink-0">
        <div className="absolute inset-0 bg-gradient-to-r from-[#2C5F6F]/5 to-[#4db8a8]/5"></div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#4db8a8] to-[#2C5F6F] rounded-full blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
                <img
                  src="/images/design-mode/nominik.jpg"
                  alt="Nominik"
                  className="relative rounded-full w-12 h-12 border-2 border-white shadow-lg"
                />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full animate-pulse"></span>
              </div>
              <div>
                <h3 className="text-gray-900 font-bold text-lg flex items-center gap-2">
                  Nominik
                  <Sparkles className="w-4 h-4 text-[#4db8a8]" />
                </h3>
                <p className="text-sm text-gray-500 font-medium">Asistente Virtual IA</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-semibold text-emerald-700">En línea</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scroll-smooth relative" ref={scrollRef}>
        
        <div className="relative max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 space-y-4">
          {messages.map((message, index) => (
            <div 
              key={message.id} 
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-500`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {message.role === "bot" && (
                <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 self-end mb-1 shadow-md ring-2 ring-white hidden sm:block">
                  <img src="/images/design-mode/nominik.jpg" alt="bot" className="w-full h-full object-cover"/>
                </div>
              )}
              
              <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[75%]">
                <div
                  className={`relative group rounded-2xl px-4 py-3 shadow-sm ${
                    message.role === "user"
                      ? "bg-gradient-to-br from-[#4db8a8] to-[#3da393] text-white rounded-br-md"
                      : "bg-white text-gray-800 rounded-bl-md border border-gray-100 hover:border-gray-200 transition-colors"
                  }`}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{message.text}</p>
                  
                  {/* Subtle timestamp on hover */}
                  <span className={`absolute -bottom-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity ${
                    message.role === "user" ? "right-0 text-gray-400" : "left-0 text-gray-400"
                  }`}>
                    {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
              
              {message.role === "user" && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 shrink-0 self-end mb-1 shadow-md ring-2 ring-white hidden sm:flex items-center justify-center">
                  <span className="text-gray-600 font-semibold text-sm">Tú</span>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start items-end gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 mb-1 shadow-md ring-2 ring-white hidden sm:block">
                <img src="/images/design-mode/nominik.jpg" alt="bot" className="w-full h-full object-cover"/>
              </div>
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-md px-5 py-4">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 bg-[#4db8a8] rounded-full animate-bounce"></div>
                  <div className="w-2.5 h-2.5 bg-[#4db8a8] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2.5 h-2.5 bg-[#4db8a8] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modern Input Area with Glassmorphism */}
      <div className="relative backdrop-blur-xl bg-white/80 border-t border-gray-200/50 shadow-lg shrink-0">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-50/50 to-transparent"></div>
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex gap-3 items-end bg-white border-2 border-gray-200 rounded-2xl p-2 focus-within:border-[#4db8a8] focus-within:ring-4 focus-within:ring-[#4db8a8]/10 transition-all duration-200 shadow-sm hover:shadow-md">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={isLoading}
              type="text"
              placeholder="Escribe tu mensaje aquí..."
              className="flex-1 bg-transparent border-none px-3 py-2.5 text-[15px] text-gray-800 placeholder:text-gray-400 focus:outline-none disabled:opacity-50"
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-br from-[#4db8a8] to-[#3da393] hover:from-[#3da393] hover:to-[#2d8c7d] text-white rounded-xl p-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#4db8a8]" />
              <p className="text-xs font-medium text-gray-400">Powered by AI</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
