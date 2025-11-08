import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import Button from './ui/Button';
import Card from './ui/Card';
import Spinner from './ui/Spinner';
import { SparklesIcon, ClipboardIcon } from './icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface CopywriterAssistantProps {
  initialPrompt?: string | null;
}

const CopywriterAssistant: React.FC<CopywriterAssistantProps> = ({ initialPrompt }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Halo! Ada yang bisa saya bantu dengan teks pemasaran Anda hari ini? Minta judul iklan, deskripsi produk, atau caption media sosial.' }
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    chatRef.current = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: 'Anda adalah seorang copywriter pemasaran yang cerdas dan kreatif. Tujuan Anda adalah membantu pengguna membuat teks iklan, judul, postingan media sosial, dan deskripsi produk yang menarik. Gunakan format Markdown (seperti judul, daftar berpoin, dan teks tebal) untuk menyusun jawaban Anda agar mudah dibaca. Sertakan emoji yang relevan untuk membuat teks lebih menarik. Jaga agar nada bicara Anda menarik dan persuasif.',
      },
    });
  }, []);

  useEffect(() => {
    if (initialPrompt) {
      setInput(initialPrompt);
    }
  }, [initialPrompt]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    
    setLoading(true);
    setError(null);
    const currentInput = input;
    setInput('');

    try {
      if (!chatRef.current) {
        throw new Error("Chat belum diinisialisasi");
      }
      
      const responseStream = await chatRef.current.sendMessageStream({ message: currentInput });

      let firstChunk = true;
      for await (const chunk of responseStream) {
        // The chunk type is GenerateContentResponse.
        const chunkText = chunk.text;
        if (firstChunk) {
          setLoading(false);
          setMessages(prev => [...prev, { role: 'model', text: chunkText }]);
          firstChunk = false;
        } else {
          setMessages(prev => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'model') {
              lastMessage.text += chunkText;
            }
            return newMessages;
          });
        }
      }
      
      if (firstChunk) { // Handle cases where the stream is empty.
          setLoading(false);
      }

    } catch (err: any) {
      setError(err.message || 'Terjadi sebuah kesalahan.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Asisten Penulis Cerdas</h2>
        <p className="mt-2 text-lg text-slate-400">
          Rekan kreatif Anda untuk menulis teks pemasaran yang menarik. Hasilkan judul, deskripsi, CTA, dan lainnya.
        </p>
      </div>

      <Card className="flex flex-col h-[70vh]">
        <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-white"/></div>}
              <div className={`relative px-4 py-3 rounded-lg max-w-lg ${msg.role === 'user' ? 'bg-slate-700 text-slate-100' : 'bg-slate-900 text-slate-300'}`}>
                {msg.role === 'model' && (
                    <button 
                        onClick={() => handleCopy(msg.text, index)}
                        className="absolute top-2 right-2 p-1.5 bg-slate-700/50 rounded-md text-slate-400 hover:text-white hover:bg-slate-600 transition-all"
                        aria-label="Salin teks"
                    >
                        {copiedIndex === index ? (
                            <span className="text-xs font-bold">Disalin!</span>
                        ) : (
                            <ClipboardIcon className="w-4 h-4" />
                        )}
                    </button>
                )}
                {msg.role === 'user' ? (
                     <div className="whitespace-pre-wrap">{msg.text}</div>
                ) : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-invert max-w-none prose-p:leading-relaxed prose-headings:text-indigo-300 prose-a:text-indigo-400 prose-strong:text-slate-100 prose-li:my-1">
                        {msg.text}
                    </ReactMarkdown>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-white"/></div>
              <div className="px-4 py-2 rounded-lg bg-slate-900 text-slate-300">
                <Spinner className="w-5 h-5" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="mt-6">
          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-grow bg-slate-900 border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
              placeholder="Minta 3 judul untuk kedai kopi..."
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !input.trim()}>
              Kirim
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};

export default CopywriterAssistant;