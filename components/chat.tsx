"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles } from 'lucide-react';

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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (messages.length === 0) {
      const timer = setTimeout(() => {
        setMessages([{ 
          id: generateId(), 
          role: "bot", 
          text: "¡Hola! Soy Nominik 👋, tu asistente virtual de Nommy. ¿En qué puedo ayudarte hoy?" 
        }]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const formatMessagesForAPI = (currentHistory, lastUserMessage) => {
    const history = currentHistory.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.text
    }));
    return [...history, { role: 'user', content: lastUserMessage }];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    const newUserMsg = { id: generateId(), role: "user", text: userText };
    
    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/nomi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: formatMessagesForAPI(messages, userText),
          sendEmail: { enabled: false, email: 'laura.carbajal@nommy.mx' }
        }),
      });

      const data = await response.json();
      const botReply = data.text;

      setMessages(prev => [...prev, { id: generateId(), role: "bot", text: botReply }]);

      // Envío automático si el bot detecta que se necesita un ticket
      const isTicket = botReply.toLowerCase().includes("ticket");
      if (isTicket) {
        const allMessages = [
          ...formatMessagesForAPI(messages, userText),
          { role: 'assistant', content: botReply }
        ];

        fetch('/api/nomi', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: allMessages,
            sendEmail: { enabled: true, email: 'laura.carbajal@nommy.mx' }
          }),
        }).catch(err => console.error("❌ Error enviando correo automático:", err));
      }

    } catch (error) {
      console.error("Chat Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-[100dvh] bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="relative backdrop-blur-xl bg-white/80 border-b border-gray-200/50 shadow-sm shrink-0">
        <div className="relative max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <img src="/images/design-mode/nominik.jpg" alt="Nominik" className="rounded-full w-12 h-12 border-2 border-white shadow-lg" />
          <div>
            <h3 className="text-gray-900 font-bold text-lg flex items-center gap-2">
              Nominik <Sparkles className="w-4 h-4 text-[#4db8a8]" />
            </h3>
            <p className="text-sm text-gray-500 font-medium">Asistente Virtual IA</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4" ref={scrollRef}>
        <div className="max-w-4xl mx-auto">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 mb-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`rounded-2xl px-4 py-3 max-w-[80%] shadow-sm ${
                message.role === "user" ? "bg-[#4db8a8] text-white" : "bg-white border border-gray-100 text-gray-800"
              }`}>
                <p className="whitespace-pre-wrap">{message.text}</p>
              </div>
            </div>
          ))}
          {isLoading && <div className="text-xs text-gray-400 animate-pulse">Nominik está escribiendo...</div>}
        </div>
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Escribe tu duda aquí..."
            className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2 focus:border-[#4db8a8] outline-none"
          />
          <button type="submit" disabled={isLoading || !input.trim()} className="bg-[#4db8a8] text-white p-3 rounded-xl">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}