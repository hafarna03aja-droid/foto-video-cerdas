import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import Button from './ui/Button';
import Card from './ui/Card';
import Spinner from './ui/Spinner';
import { SparklesIcon, DownloadIcon, WandIcon } from './icons';
import PromotionGenerator from './PromotionGenerator';
import VoiceOverGeneratorButton from './VoiceOverGeneratorButton';
import CopywriterButton from './CopywriterButton';

interface ImageGeneratorProps {
  onEditRequest: (imageUrl: string) => void;
  onVoiceRequest: (text: string) => void;
  onCopywriterRequest: (prompt: string) => void;
}

const aspectRatios = [
    { value: '1:1', label: '1:1 Persegi' },
    { value: '16:9', label: '16:9 Lanskap' },
    { value: '9:16', label: '9:16 Potret' },
    { value: '4:3', label: '4:3 Standar' },
    { value: '3:4', label: '3:4 Vertikal' },
];

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onEditRequest, onVoiceRequest, onCopywriterRequest }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) {
      setError('Silakan masukkan prompt (perintah teks).');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedImages([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
        },
      });

      const images = response.generatedImages.map(
        (img) => `data:image/jpeg;base64,${img.image.imageBytes}`
      );
      setGeneratedImages(images);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat membuat gambar.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Generator Gambar Cerdas</h2>
        <p className="mt-2 text-lg text-slate-400">
          Buat gambar unik dan memukau dari deskripsi teks menggunakan Imagen 4. Sempurna untuk materi iklan, postingan media sosial, dan lainnya.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-slate-300">
              Prompt (Perintah Teks)
            </label>
            <textarea
              id="prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-1 block w-full bg-slate-900 border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
              placeholder="contoh: Foto sinematik robot memegang skateboard merah di jalanan kota saat matahari terbenam."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Rasio Aspek
            </label>
            <div className="flex flex-wrap gap-2">
                {aspectRatios.map((ratio) => (
                    <button
                        key={ratio.value}
                        type="button"
                        onClick={() => setAspectRatio(ratio.value)}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            aspectRatio === ratio.value
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                        }`}
                    >
                        {ratio.label}
                    </button>
                ))}
            </div>
          </div>
          <div>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner /> : <SparklesIcon className="w-5 h-5" />}
              <span>{loading ? 'Membuat...' : 'Buat Gambar'}</span>
            </Button>
          </div>
        </form>
      </Card>

      {error && (
        <div className="bg-red-900/50 border-red-700 text-red-300 px-4 py-3 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {generatedImages.length > 0 && (
        <Card>
          <h3 className="text-lg font-medium text-white mb-4">Gambar yang Dihasilkan</h3>
          <div className="grid grid-cols-1 gap-4">
            {generatedImages.map((src, index) => (
              <div key={index}>
                <img src={src} alt={`Gambar yang dihasilkan ${index + 1}`} className="rounded-lg w-full object-contain" />
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
                    <a href={src} download={`canvas-ai-image-${Date.now()}.jpg`} className="w-full">
                       <Button variant="secondary" className="w-full">
                           <DownloadIcon className="w-5 h-5"/>
                           <span>Unduh</span>
                       </Button>
                    </a>
                   <Button onClick={() => onEditRequest(src)} className="w-full">
                       <WandIcon className="w-5 h-5"/>
                       <span>Edit Gambar Ini</span>
                   </Button>
                   <VoiceOverGeneratorButton imageUrl={src} onVoiceRequest={onVoiceRequest} />
                   <CopywriterButton imageUrl={src} onCopywriterRequest={onCopywriterRequest} />
                   <PromotionGenerator imageUrl={src} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ImageGenerator;