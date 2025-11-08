import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import Button from './ui/Button';
import Card from './ui/Card';
import Spinner from './ui/Spinner';
import { MicIcon, DownloadIcon } from './icons';

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

// Raw PCM to AudioBuffer decoding function for playback
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

// Helper to write string to DataView
function writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}

// Function to convert raw PCM data to a .wav file Blob
function encodeWAV(samples: Uint8Array, sampleRate: number, numChannels: number): Blob {
    const pcmData = new Int16Array(samples.buffer);
    const dataSize = pcmData.length * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const bitsPerSample = 16;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');

    // fmt sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);

    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write PCM data
    let offset = 44;
    for (let i = 0; i < pcmData.length; i++, offset += 2) {
        view.setInt16(offset, pcmData[i], true);
    }
    
    return new Blob([view], { type: 'audio/wav' });
}

interface VoiceGeneratorProps {
  initialText?: string | null;
}

const styleCategories = {
  'Berdasarkan Emosi': {
    'Senang & Ceria': 'A cheerful and enthusiastic voice, like someone sharing good news.',
    'Motivasi & Energik': 'An upbeat and energetic tone for a motivational speech.',
    'Ramah & Hangat': 'Friendly and welcoming, with a smile in the voice.',
    'Tenang & Rileks': 'A calm and relaxing voice, suitable for a meditation guide.',
    'Lembut & Menenangkan': 'A soft and soothing tone, like reading a bedtime story.',
    'Formal & Berwibawa': 'A professional and authoritative voice for a news report.',
    'Serius & Meyakinkan': 'A clear and direct voice, speaking with conviction.',
    'Sedih & Melankolis': 'A sad and melancholic tone, as if reflecting on a loss.',
    'Dramatis & Tegang': 'A dramatic and suspenseful voice for a thriller story narration.',
  },
  'Berdasarkan Karakter atau Peran': {
    'Narator Dokumenter': 'The voice of a documentary narrator, clear, informative, and engaging.',
    'Asisten AI': 'A helpful and neutral AI assistant voice.',
    'Penyihir Tua Bijak': 'An old, wise wizard speaking thoughtfully.',
    'Pahlawan Muda Energik': 'A young, energetic hero shouting a battle cry.',
    'Karakter Gugup': 'A nervous character who speaks quickly and stutters slightly.',
  },
  'Berdasarkan Konteks Penggunaan': {
    'Iklan & Promosi': 'An upbeat, persuasive, and exciting voice for a product advertisement.',
    'Pendidikan & E-Learning': 'An educational and clear voice, speaking like a teacher explaining a concept.',
    'Sistem Telepon (IVR)': 'A professional and clear voice for a phone system greeting.',
  },
};

const VoiceGenerator: React.FC<VoiceGeneratorProps> = ({ initialText }) => {
  const [text, setText] = useState<string>('');
  const [voice, setVoice] = useState<string>('Kore');
  const [stylePrompt, setStylePrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (initialText) {
      setText(initialText);
    }
  }, [initialText]);

  let audioContext: AudioContext | null = null;
  const getAudioContext = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return audioContext;
  }
  
  const playAudioBuffer = (buffer: AudioBuffer) => {
    const ctx = getAudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text) {
      setError('Silakan masukkan teks untuk membuat audio.');
      return;
    }

    setLoading(true);
    setError(null);
    if(audioUrl) {
        URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);

    const finalText = stylePrompt ? `(${stylePrompt}) ${text}` : text;

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: finalText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice },
            },
          },
        },
      });
      
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (base64Audio) {
        const audioBytes = decode(base64Audio);

        // For immediate playback with Web Audio API
        const audioBuffer = await decodeAudioData(audioBytes, getAudioContext(), 24000, 1);
        playAudioBuffer(audioBuffer);
        
        // Create a downloadable .wav file for the audio element and download link
        const wavBlob = encodeWAV(audioBytes, 24000, 1);
        const wavUrl = URL.createObjectURL(wavBlob);
        setAudioUrl(wavUrl);

      } else {
        throw new Error("Tidak ada data audio yang diterima dari API.");
      }

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat membuat suara.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const voices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Generator Suara Cerdas (TTS)</h2>
        <p className="mt-2 text-lg text-slate-400">
          Ubah teks menjadi ucapan yang terdengar alami untuk sulih suara video, narasi iklan, dan lainnya.
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="text" className="block text-sm font-medium text-slate-300">
              Teks
            </label>
            <textarea
              id="text"
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-1 block w-full bg-slate-900 border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
              placeholder="contoh: Temukan koleksi musim panas terbaru kami! Dapatkan diskon 50% untuk waktu terbatas."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Suara Dasar
            </label>
            <div className="flex flex-wrap gap-2">
                {voices.map((v) => (
                    <button
                        key={v}
                        type="button"
                        onClick={() => setVoice(v)}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                            voice === v
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                        }`}
                    >
                        {v}
                    </button>
                ))}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-700">
            <label className="block text-sm font-medium text-slate-300">
                Gaya Suara (Opsional)
            </label>
            
            {Object.entries(styleCategories).map(([category, styles]) => (
                <div key={category}>
                    <h4 className="text-xs font-semibold text-indigo-400 mb-2 uppercase tracking-wider">{category}</h4>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(styles).map(([name, prompt]) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => setStylePrompt(current => current === prompt ? '' : prompt)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                    stylePrompt === prompt
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                }`}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
          </div>

          <div>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner /> : <MicIcon className="w-5 h-5" />}
              <span>{loading ? 'Membuat...' : 'Buat Sulih Suara'}</span>
            </Button>
          </div>
        </form>
      </Card>
      
      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md">
          <p>{error}</p>
        </div>
      )}

      {audioUrl && !loading && (
        <Card>
          <h3 className="text-lg font-medium text-white mb-4">Audio yang Dihasilkan</h3>
          <p className="text-sm text-slate-400 mb-2">Audio diputar secara otomatis. Gunakan kontrol di bawah untuk memutar ulang.</p>
          <audio controls className="w-full" key={audioUrl}>
              <source src={audioUrl} type="audio/wav" />
              Browser Anda tidak mendukung elemen audio.
          </audio>
          <div className="mt-4">
            <a href={audioUrl} download={`canvas-ai-voice-${Date.now()}.wav`}>
                <Button className="w-full">
                    <DownloadIcon className="w-5 h-5" />
                    <span>Unduh Audio (.wav)</span>
                </Button>
            </a>
          </div>
        </Card>
      )}
    </div>
  );
};

export default VoiceGenerator;