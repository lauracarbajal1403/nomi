"use client"
import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles } from 'lucide-react';

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Ícono SVG de WhatsApp
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

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
            sendEmail: { enabled: true, email: 'laura.carbajal@whathecode.com' }
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

          {/* Botón de WhatsApp */}
          <a
            href="https://wa.me/523315179175"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md transition-all duration-200 hover:shadow-lg active:scale-95"
          >
            <WhatsAppIcon />
            <span className="hidden sm:inline">WhatsApp</span>
          </a>
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