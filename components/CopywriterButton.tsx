import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Button from './ui/Button';
import Spinner from './ui/Spinner';
import { MessageCircleIcon } from './icons';

interface CopywriterButtonProps {
  imageUrl: string;
  onCopywriterRequest: (prompt: string) => void;
}

const CopywriterButton: React.FC<CopywriterButtonProps> = ({ imageUrl, onCopywriterRequest }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateCopywritingPrompt = async () => {
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
      
      const promptForPromptGenerator = `
      Anda adalah seorang 'prompt engineer' AI yang sangat ahli. Berdasarkan gambar yang diberikan, buatlah sebuah PROMPT TUNGGAL yang komprehensif untuk diberikan kepada AI lain yang merupakan seorang copywriter profesional.
      
      Prompt yang Anda buat harus menginstruksikan copywriter AI untuk menghasilkan paket materi pemasaran lengkap dalam Bahasa Indonesia. Pastikan prompt tersebut meminta semua hal berikut dengan jelas:
      
      1.  **Judul Iklan:** Minta 3-5 pilihan judul iklan yang menarik, singkat, dan persuasif.
      2.  **Deskripsi Produk:** Minta deskripsi produk yang kaya narasi, menonjolkan fitur dan manfaat utama yang tersirat dari gambar.
      3.  **Caption Media Sosial:** Minta caption untuk Instagram atau Facebook yang mendalam, menceritakan sebuah kisah di balik gambar untuk menciptakan koneksi emosional.
      4.  **Teks Landing Page:** Minta draf teks untuk bagian utama (hero section) dari sebuah landing page, yang harus profesional, meyakinkan, dan diakhiri dengan ajakan bertindak (call-to-action) yang kuat.
      
      Buatlah prompt ini sebagai satu blok teks yang siap pakai untuk disalin-tempel. Mulailah prompt dengan: "Berdasarkan gambar yang disediakan, tolong buatkan paket materi pemasaran berikut:"
      `.trim();

      const textPart = { text: promptForPromptGenerator };

      const genResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
      });

      const scriptText = genResponse.text.trim();
      if (scriptText) {
        onCopywriterRequest(scriptText);
      } else {
        throw new Error("AI tidak dapat membuat prompt untuk gambar ini.");
      }

    } catch (err: any) {
      setError(err.message || 'Gagal membuat prompt copywriting.');
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
        onClick={handleGenerateCopywritingPrompt} 
        disabled={isLoading} 
        className="w-full"
        title={error || "Buat teks iklan lengkap dari gambar ini"}
      >
        {isLoading ? <Spinner className="w-5 h-5"/> : <MessageCircleIcon className="w-5 h-5" />}
        <span>{isLoading ? 'Menganalisis...' : (error ? 'Gagal!' : 'Tulis Teks Iklan')}</span>
      </Button>
    </>
  );
};

export default CopywriterButton;
