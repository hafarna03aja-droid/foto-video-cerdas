import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import { MicIcon } from './icons';

interface VoiceOverGeneratorButtonProps {
  imageUrl: string;
  onVoiceRequest: (text: string) => void;
}

const VoiceOverGeneratorButton: React.FC<VoiceOverGeneratorButtonProps> = ({ imageUrl, onVoiceRequest }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateVoiceScript = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();
      
      const base64Data = await new Promise<string>((resolve, reject) => {
        reader.readAsDataURL(blob);
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
      });

      const imagePart = { inlineData: { data: base64Data, mimeType: blob.type } };
      const textPart = { text: "Anda adalah seorang penulis naskah iklan profesional. Berdasarkan gambar ini, tuliskan naskah sulih suara (voice-over) yang singkat, kuat, dan persuasif dalam Bahasa Indonesia. Naskah ini harus terasa premium, membangkitkan emosi, dan diakhiri dengan kalimat yang meninggalkan kesan mendalam atau ajakan bertindak yang halus. Fokus pada suasana dan cerita yang disampaikan oleh gambar. Buatlah agar naskah ini terdengar seperti narasi untuk iklan TV mewah. Perkirakan durasi naskah sekitar 10-15 detik saat dibacakan." };

      const genResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
      });

      const scriptText = genResponse.text.trim();
      if (scriptText) {
        onVoiceRequest(scriptText);
      } else {
        throw new Error("AI tidak dapat menghasilkan skrip untuk gambar ini.");
      }

    } catch (err: any) {
      setError(err.message || 'Gagal membuat skrip suara.');
      console.error(err);
      // Show error for a few seconds
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="secondary" 
        onClick={handleGenerateVoiceScript} 
        disabled={isLoading} 
        className="w-full"
        title={error || "Buat sulih suara dari gambar ini"}
      >
        {isLoading ? <Spinner className="w-5 h-5"/> : <MicIcon className="w-5 h-5" />}
        <span>{isLoading ? 'Menganalisis...' : (error ? 'Gagal!' : 'Buat Suara')}</span>
      </Button>
    </>
  );
};

export default VoiceOverGeneratorButton;