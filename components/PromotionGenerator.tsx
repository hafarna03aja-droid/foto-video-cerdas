import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import { MegaphoneIcon, ClipboardIcon, FacebookIcon, InstagramIcon, XIcon, TikTokIcon } from './icons';

interface PromotionGeneratorProps {
  imageUrl?: string | null;
  videoUrl?: string | null;
  prompt?: string | null;
}

type Platform = 'facebook' | 'instagram' | 'x' | 'tiktok';

interface Promotions {
  facebook: string;
  instagram: string;
  x: string;
  tiktok: string;
}

const platformConfig: Record<Platform, { name: string; icon: React.FC<{ className?: string }> }> = {
    facebook: { name: 'Facebook', icon: FacebookIcon },
    instagram: { name: 'Instagram', icon: InstagramIcon },
    x: { name: 'X', icon: XIcon },
    tiktok: { name: 'TikTok', icon: TikTokIcon },
};

const PromotionGenerator: React.FC<PromotionGeneratorProps> = ({ imageUrl, videoUrl, prompt }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedPromotions, setGeneratedPromotions] = useState<Promotions | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<Platform | null>(null);
  const [activeTab, setActiveTab] = useState<Platform>('facebook');

  const handleOpenModal = () => {
    setIsModalOpen(true);
    handleGenerate();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setGeneratedPromotions(null);
    setError(null);
    setIsLoading(false);
    setCopySuccess(null);
    setActiveTab('facebook');
  };

  const handleCopyToClipboard = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopySuccess(activeTab);
      setTimeout(() => setCopySuccess(null), 2000);
    });
  };

  const handleGenerate = async () => {
    if (!imageUrl && !videoUrl) return;

    setIsLoading(true);
    setError(null);
    setGeneratedPromotions(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const parts: any[] = [];

      const basePrompt = `Anda adalah seorang manajer media sosial ahli yang berspesialisasi dalam membuat konten yang viral dan menarik. Buatlah sebuah paket konten media sosial untuk berbagai platform berdasarkan materi yang diberikan. Hasilkan respons dalam format JSON dengan kunci "facebook", "instagram", "x", dan "tiktok".
- Untuk Facebook: Buat narasi yang kaya dan menarik. Ceritakan sebuah kisah di balik gambar/video ini. Gunakan gaya penceritaan yang mendalam untuk membangkitkan emosi dan koneksi dengan audiens. Postingan harus lengkap, menarik, dan diakhiri dengan ajakan bertindak atau pertanyaan yang memancing diskusi. Sertakan 1-2 hashtag yang relevan.
- Untuk Instagram: Tulis caption yang berfokus pada visual, gunakan 2-3 emoji, dan sertakan 3-5 hashtag yang relevan dan spesifik.
- Untuk X: Tulis tweet yang singkat, tajam, dan menarik, di bawah 280 karakter, dengan 1-2 hashtag.
- Untuk TikTok: Tulis caption yang menarik untuk video, sebutkan ide-ide tren atau audio jika relevan, dan gunakan 2-4 hashtag yang sedang tren.
Semua postingan harus dalam Bahasa Indonesia.`;

      let contextPrompt = '';
      
      if (imageUrl) {
        contextPrompt = "Materi yang diberikan adalah sebuah gambar.";
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        await new Promise<void>((resolve, reject) => {
            reader.onloadend = () => {
                const base64Data = (reader.result as string).split(',')[1];
                parts.push({ inlineData: { data: base64Data, mimeType: blob.type } });
                resolve();
            };
            reader.onerror = reject;
        });
      } else if (videoUrl) {
        contextPrompt = `Materi yang diberikan adalah sebuah video yang dibuat dengan prompt: "${prompt || 'Tidak ada prompt yang diberikan'}".`;
      }
      
      const fullPrompt = `${basePrompt}\n\nKonteks: ${contextPrompt}`;
      parts.push({ text: fullPrompt });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                facebook: { type: Type.STRING, description: 'Narasi yang kaya dan menarik untuk Facebook, menggunakan penceritaan untuk membangkitkan emosi dan diakhiri dengan ajakan bertindak.' },
                instagram: { type: Type.STRING, description: 'Caption visual untuk Instagram, dengan emoji dan fokus pada gambar/video.' },
                x: { type: Type.STRING, description: 'Tweet singkat dan padat untuk X, di bawah 280 karakter.' },
                tiktok: { type: Type.STRING, description: 'Caption untuk video TikTok, termasuk ide tren dan suara yang relevan.' },
              },
              required: ['facebook', 'instagram', 'x', 'tiktok'],
            },
        },
      });
      
      const promotions = JSON.parse(response.text);
      setGeneratedPromotions(promotions);

    } catch (err: any) {
      setError(err.message || 'Gagal membuat teks promosi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button variant="secondary" onClick={handleOpenModal} className="flex-1">
        <MegaphoneIcon className="w-5 h-5" />
        <span>Buat Promosi</span>
      </Button>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Paket Promosi Media Sosial oleh AI">
        {isLoading && (
          <div className="flex flex-col items-center justify-center h-48">
            <Spinner className="w-10 h-10 mb-4" />
            <p className="text-slate-300">AI sedang meracik konten untuk setiap platform...</p>
          </div>
        )}
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md">
            <p>{error}</p>
          </div>
        )}
        {!isLoading && generatedPromotions && (
          <div className="space-y-4">
            <div className="border-b border-slate-700">
                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                    {(Object.keys(platformConfig) as Platform[]).map((platform) => {
                         const Icon = platformConfig[platform].icon;
                         return (
                            <button
                                key={platform}
                                onClick={() => setActiveTab(platform)}
                                className={`${
                                    activeTab === platform
                                    ? 'border-indigo-500 text-indigo-400'
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500'
                                } flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
                                aria-current={activeTab === platform ? 'page' : undefined}
                            >
                                <Icon className="w-5 h-5" />
                                {platformConfig[platform].name}
                            </button>
                        )
                    })}
                </nav>
            </div>

            <div className="mt-4">
                 <div className="bg-slate-900 p-4 rounded-md whitespace-pre-wrap text-slate-300 min-h-[150px]">
                    {generatedPromotions[activeTab]}
                </div>
                <Button onClick={() => handleCopyToClipboard(generatedPromotions[activeTab])} className="w-full mt-4">
                    <ClipboardIcon className="w-5 h-5" />
                    <span>{copySuccess === activeTab ? 'Berhasil Disalin!' : `Salin Teks ${platformConfig[activeTab].name}`}</span>
                </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
};

export default PromotionGenerator;