import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenAI, VideosOperation, Modality } from '@google/genai';
import { fileToBase64 } from '../utils/fileUtils';
import Button from './ui/Button';
import Card from './ui/Card';
import Spinner from './ui/Spinner';
import { VideoIcon, DownloadIcon, SparklesIcon } from './icons';
import PromotionGenerator from './PromotionGenerator';

// Add a declaration for the aistudio object on the window
// FIX: Defined a named interface for the aistudio object.
// This resolves conflicts that occur when multiple declarations for the
// same global property use different type definitions (e.g., named vs. inline).
declare global {
    interface AIStudio {
        hasSelectedApiKey: () => Promise<boolean>;
        openSelectKey: () => Promise<void>;
    }
    interface Window {
        aistudio?: AIStudio;
    }
}

// Base64 decoding function
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Raw PCM to AudioBuffer decoding function
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


interface VideoGeneratorProps {
  initialImageUrl?: string | null;
}

const loadingMessages = [
  "Memanaskan kamera virtual...",
  "Menulis skrip adegan yang sempurna...",
  "Memilih aktor digital...",
  "Merender frame definisi tinggi...",
  "Menyusun lapisan video...",
  "Menambahkan sentuhan akhir...",
  "Proses ini bisa memakan waktu beberapa menit. Karya seni hebat butuh waktu!",
];

const aspectRatios = [
    { value: '16:9', label: '16:9 Lanskap' },
    { value: '9:16', label: '9:16 Potret' },
];

const resolutions = [
    { value: '1080p', label: '1080p (Tertinggi)' },
    { value: '720p', label: '720p (Cepat)' },
];

const voices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];


const VideoGenerator: React.FC<VideoGeneratorProps> = ({ initialImageUrl }) => {
  const [prompt, setPrompt] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<string>('16:9');
  const [resolution, setResolution] = useState<string>('1080p');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [apiKeySelected, setApiKeySelected] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>(loadingMessages[0]);
  
  // Voiceover state
  const [addVoiceover, setAddVoiceover] = useState(false);
  const [voiceoverScript, setVoiceoverScript] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [isScriptLoading, setIsScriptLoading] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  const getAudioContext = () => {
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContextRef.current;
  }

  const checkApiKey = useCallback(async () => {
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      setApiKeySelected(hasKey);
    } else {
        // Fallback for environments where aistudio is not available
        console.warn("aistudio not found on window. Assuming API key is set via environment variable.");
        setApiKeySelected(true);
    }
  }, []);

  useEffect(() => {
    checkApiKey();
  }, [checkApiKey]);

  useEffect(() => {
    if (initialImageUrl) {
        let createdUrl: string | null = null;
        const convertDataUrlToFile = async (dataUrl: string, filename:string): Promise<File> => {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            return new File([blob], filename, { type: blob.type });
        };

        convertDataUrlToFile(initialImageUrl, `edited-image-${Date.now()}.png`)
            .then(file => {
                setImageFile(file);
                createdUrl = URL.createObjectURL(file);
                setImagePreview(createdUrl);
            })
            .catch(err => {
                console.error("Gagal mengonversi data URL menjadi file:", err);
                setError("Gagal memuat gambar yang diedit untuk pembuatan video.");
            });
        
        return () => {
            if (createdUrl) {
                URL.revokeObjectURL(createdUrl);
            }
        }
    }
  }, [initialImageUrl]);

  useEffect(() => {
    // Fix: Use ReturnType<typeof setInterval> for browser compatibility instead of NodeJS.Timeout.
    let interval: ReturnType<typeof setInterval>;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          return loadingMessages[(currentIndex + 1) % loadingMessages.length];
        });
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [loading]);
  
  const handleSelectKey = async () => {
    if (window.aistudio) {
        await window.aistudio.openSelectKey();
        // Assume success to avoid race conditions and re-check on next generation attempt
        setApiKeySelected(true); 
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      if (imagePreview) {
          URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(URL.createObjectURL(file));
      setAddVoiceover(false);
      setVoiceoverScript('');
      setAudioBuffer(null);
    }
  };

  const pollOperation = async (ai: GoogleGenAI, operation: VideosOperation): Promise<VideosOperation> => {
    let currentOperation = operation;
    while (!currentOperation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      currentOperation = await ai.operations.getVideosOperation({ operation: currentOperation });
    }
    return currentOperation;
  };

  const handleGenerateScript = async () => {
    if (!imageFile) return;
    setIsScriptLoading(true);
    setError(null);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const imageBase64 = await fileToBase64(imageFile);
        const imagePart = { inlineData: { data: imageBase64, mimeType: imageFile.type } };
        const promptText = "Anda adalah seorang penulis naskah iklan yang kreatif. Berdasarkan gambar ini, tuliskan naskah sulih suara singkat (sekitar 2-3 kalimat) yang deskriptif dan menarik. Jika ini adalah foto produk, fokus pada keunggulan produk. Jika ini adalah foto keluarga atau pemandangan, ciptakan suasana yang hangat dan menggugah emosi. Naskah harus dalam Bahasa Indonesia.";
        const textPart = { text: promptText };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        setVoiceoverScript(response.text.trim());

    } catch(err: any) {
        setError(err.message || 'Gagal membuat skrip.');
    } finally {
        setIsScriptLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt && !imageFile) {
      setError('Silakan masukkan prompt atau unggah gambar awal.');
      return;
    }
     await checkApiKey();
    if (!apiKeySelected) {
      setError('Silakan pilih kunci API untuk membuat video.');
      return;
    }

    setLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);
    setAudioBuffer(null);
    setLoadingMessage(loadingMessages[0]);

    try {
      // Re-instantiate to ensure the latest API key is used
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      const imagePayload = imageFile ? {
        imageBytes: await fileToBase64(imageFile),
        mimeType: imageFile.type,
      } : undefined;

      const videoPromise = ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: imagePayload,
        config: {
          numberOfVideos: 1,
          resolution: resolution as '720p' | '1080p',
          aspectRatio: aspectRatio as '16:9' | '9:16',
        }
      }).then(op => pollOperation(ai, op));

      const audioPromise = (addVoiceover && voiceoverScript)
        ? ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: voiceoverScript }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: selectedVoice } },
              },
            },
          })
        : Promise.resolve(null);

      const [finalOperation, audioResponse] = await Promise.all([videoPromise, audioPromise]);


      const downloadLink = finalOperation.response?.generatedVideos?.[0]?.video?.uri;

      if (downloadLink) {
        // VEO returns a URI that needs the API key appended for access
        setGeneratedVideoUrl(`${downloadLink}&key=${process.env.API_KEY}`);
      } else {
        throw new Error('Pembuatan video selesai, tetapi tidak ada URL video yang dikembalikan.');
      }

      const base64Audio = audioResponse?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        const audioBytes = decode(base64Audio);
        const buffer = await decodeAudioData(audioBytes, getAudioContext(), 24000, 1);
        setAudioBuffer(buffer);
      }

    } catch (err: any) {
        if (err.message?.includes('Requested entity was not found')) {
            setError('Kunci API Anda tidak valid. Silakan pilih kunci yang valid.');
            setApiKeySelected(false);
        } else {
            setError(err.message || 'Terjadi kesalahan saat membuat video.');
        }
        console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePlayVideo = () => {
    if (audioBuffer) {
        if (audioSourceRef.current) {
            audioSourceRef.current.stop();
        }
        const ctx = getAudioContext();
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);
        source.start(0);
        audioSourceRef.current = source;
    }
  };

  const handlePauseVideo = () => {
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
    }
  };

  if (!apiKeySelected) {
    return (
        <Card className="text-center">
            <h2 className="text-2xl font-bold mb-4">Kunci API Diperlukan untuk Membuat Video</h2>
            <p className="mb-6 text-slate-400">
                Model pembuatan video Veo mengharuskan Anda memilih kunci API Anda sendiri. 
                Pastikan proyek Anda telah dikonfigurasi untuk penagihan.
            </p>
            <Button onClick={handleSelectKey}>Pilih Kunci API</Button>
            {error && <p className="text-red-400 mt-4">{error}</p>}
            <p className="mt-4 text-xs text-slate-500">
                Untuk informasi lebih lanjut, lihat <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-400">dokumentasi penagihan</a>.
            </p>
        </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Generator Video Cerdas (Veo)</h2>
        <p className="mt-2 text-lg text-slate-400">
          Buat video pendek yang dinamis dari perintah teks atau gambar awal, lengkap dengan sulih suara AI.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-slate-300">
              Prompt (opsional jika ada gambar)
            </label>
            <textarea
              id="prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-1 block w-full bg-slate-900 border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
              placeholder="contoh: Hologram neon seekor kucing mengendarai mobil sport dengan kecepatan tinggi di kota futuristik."
            />
          </div>
          <div>
            <label htmlFor="image-upload" className="block text-sm font-medium text-slate-300">
              Gambar Awal (opsional)
            </label>
            <input id="image-upload" name="image-upload" type="file" className="mt-1 block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" accept="image/*" onChange={handleFileChange} />
          </div>
          {imagePreview && (
             <img src={imagePreview} alt="Pratinjau" className="mt-2 rounded-md max-h-40" />
          )}

          {/* Voiceover Section */}
          <div className="pt-6 border-t border-slate-700">
              <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 bg-slate-800 border-slate-600 rounded text-indigo-600 focus:ring-indigo-500"
                      checked={addVoiceover}
                      onChange={(e) => setAddVoiceover(e.target.checked)}
                      disabled={!imageFile}
                  />
                  <span className={`text-lg font-semibold ${!imageFile ? 'text-slate-500' : 'text-white'}`}>
                      Tambahkan Sulih Suara (Voice-over) AI
                  </span>
              </label>
              {!imageFile && <p className="text-xs text-slate-500 mt-1">Unggah gambar awal untuk mengaktifkan fitur ini.</p>}

              {addVoiceover && imageFile && (
                  <div className="mt-4 space-y-4 pl-8">
                      <div>
                          <label htmlFor="voiceover-script" className="block text-sm font-medium text-slate-300">Naskah Sulih Suara</label>
                          <textarea
                              id="voiceover-script"
                              rows={4}
                              value={voiceoverScript}
                              onChange={(e) => setVoiceoverScript(e.target.value)}
                              className="mt-1 block w-full bg-slate-900 border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
                              placeholder="Tulis naskah Anda di sini atau buat secara otomatis."
                          />
                          <Button variant="secondary" type="button" onClick={handleGenerateScript} disabled={isScriptLoading} className="mt-2">
                              {isScriptLoading ? <Spinner/> : <SparklesIcon className="w-5 h-5"/>}
                              {isScriptLoading ? 'Membuat...' : 'Buatkan Skrip Otomatis'}
                          </Button>
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Pilih Suara</label>
                          <div className="flex flex-wrap gap-2">
                              {voices.map((v) => (
                                  <button
                                      key={v}
                                      type="button"
                                      onClick={() => setSelectedVoice(v)}
                                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                          selectedVoice === v
                                          ? 'bg-indigo-600 text-white'
                                          : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                      }`}
                                  >
                                      {v}
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>
              )}
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Rasio Aspek
              </label>
              <div className="flex gap-2">
                 {aspectRatios.map((ratio) => (
                    <button
                        key={ratio.value}
                        type="button"
                        onClick={() => setAspectRatio(ratio.value)}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex-1 justify-center ${
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
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Resolusi
              </label>
              <div className="flex gap-2">
                  {resolutions.map((res) => (
                    <button
                        key={res.value}
                        type="button"
                        onClick={() => setResolution(res.value)}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex-1 justify-center ${
                            resolution === res.value
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                        }`}
                    >
                        {res.label}
                    </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner /> : <VideoIcon className="w-5 h-5" />}
              <span>{loading ? 'Membuat Video...' : 'Buat Video'}</span>
            </Button>
          </div>
        </form>
      </Card>
      
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <Card className="text-center">
            <Spinner className="w-10 h-10 mx-auto mb-4" />
            <p className="text-lg font-semibold text-white">{loadingMessage}</p>
            <p className="text-slate-400">Pembuatan video sedang berlangsung dan mungkin memakan waktu beberapa menit.</p>
        </Card>
      )}

      {generatedVideoUrl && (
        <Card>
          <h3 className="text-lg font-medium text-white mb-4">Video yang Dihasilkan</h3>
          <video 
            controls 
            muted={!!audioBuffer}
            src={generatedVideoUrl} 
            className="w-full rounded-lg" 
            onPlay={handlePlayVideo}
            onPause={handlePauseVideo}
            onEnded={handlePauseVideo}
          />
          {audioBuffer && <p className="text-xs text-slate-400 mt-2">Audio sulih suara aktif. Pastikan volume perangkat Anda menyala. Video player dibisukan.</p>}
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <a href={generatedVideoUrl} download={`canvas-ai-video-${Date.now()}.mp4`} className="flex-1">
              <Button className="w-full">
                <DownloadIcon className="w-5 h-5" />
                <span>Unduh Video</span>
              </Button>
            </a>
            <PromotionGenerator videoUrl={generatedVideoUrl} prompt={prompt} />
          </div>
          <p className="text-center text-xs text-slate-500 mt-2">(Unduhan saat ini hanya untuk file video. Audio tidak termasuk dalam file.)</p>
        </Card>
      )}
    </div>
  );
};

export default VideoGenerator;