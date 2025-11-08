import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { fileToBase64 } from '../utils/fileUtils';
import Button from './ui/Button';
import Card from './ui/Card';
import Spinner from './ui/Spinner';
import { WandIcon, DownloadIcon, HeartIcon, DiamondIcon, ImageIcon, CubeIcon, SpotlightIcon, StarsIcon, PillarIcon, NeonIcon, PlanetIcon, WaterDropIcon, FanIcon, ClapperboardIcon, UndoIcon, RedoIcon, VideoIcon } from './icons';
import { useHistoryState } from '../hooks/useHistoryState';
import HistorySidebar from './HistorySidebar';
import PromotionGenerator from './PromotionGenerator';
import VoiceOverGeneratorButton from './VoiceOverGeneratorButton';
import CopywriterButton from './CopywriterButton';


type Step = 'upload' | 'style' | 'productStyle' | 'processing' | 'result' | 'text' | 'processingText' | 'finalResult' | 'logo' | 'processingLogo';
type Style = 'family' | 'minimalist' | 'dramatic' | 'fantasy' | 'elegant' | 'neon' | 'cosmic' | 'aquatic' | 'deco' | 'professionalCinematic';
type ImageState = { file: File; url: string } | null;

interface ImageEditorProps {
    initialSubjectImageUrl?: string | null;
    onVideoRequest?: (imageUrl: string) => void;
    onVoiceRequest?: (text: string) => void;
    onCopywriterRequest?: (prompt: string) => void;
}

export interface EditorState {
    step: Step;
    backgroundImage: ImageState;
    subjectImage: ImageState;
    customStyle: string;
    aspectRatio: string;
    finalImageUrl: string | null;
    loading: boolean;
    error: string | null;
    headline: string;
    tagline: string;
    fontStyle: string;
    textPlacement: string;
    textColor: string;
    textEffect: string;
    logoImage: ImageState;
    logoPosition: string;
    logoScale: number;
    logoOpacity: number;
}

const initialEditorState: EditorState = {
    step: 'upload',
    backgroundImage: null,
    subjectImage: null,
    customStyle: '',
    aspectRatio: 'original',
    finalImageUrl: null,
    loading: false,
    error: null,
    headline: 'LUMINA',
    tagline: 'Elegance Redefined',
    fontStyle: 'Serif elegan',
    textPlacement: 'Tengah bawah',
    textColor: 'Putih solid',
    textEffect: 'Tanpa Efek',
    logoImage: null,
    logoPosition: 'Pojok kanan bawah',
    logoScale: 15,
    logoOpacity: 100,
};

const ImageUploadBox: React.FC<{
    title: string;
    description: string;
    image: ImageState;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    id: string;
}> = ({ title, description, image, onFileChange, id }) => (
    <div className="flex-1">
        <label className="block text-sm font-medium text-slate-300 mb-2">{title}</label>
        {image ? (
            <div className="relative">
                <img src={image.url} alt="Pratinjau" className="w-full h-48 object-cover rounded-md" />
                 <label htmlFor={id} className="absolute inset-0 bg-black/50 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-md">
                    Ganti Gambar
                    <input id={id} name={id} type="file" className="sr-only" accept="image/*" onChange={onFileChange} />
                </label>
            </div>
        ) : (
            <div className="w-full h-48 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-slate-500" />
                    <div className="flex text-sm text-slate-400">
                        <label htmlFor={id} className="relative cursor-pointer bg-slate-800 rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none">
                            <span>Pilih file</span>
                            <input id={id} name={id} type="file" className="sr-only" accept="image/*" onChange={onFileChange} />
                        </label>
                    </div>
                    <p className="text-xs text-slate-500">{description}</p>
                </div>
            </div>
        )}
    </div>
);

interface CustomStyleInputProps {
    customStyle: string;
    setCustomStyle: (style: string) => void;
    onSubmit: (style: string) => void;
}

const CustomStyleInput: React.FC<CustomStyleInputProps> = ({ customStyle, setCustomStyle, onSubmit }) => {
    const [localCustomStyle, setLocalCustomStyle] = useState(customStyle);

    useEffect(() => {
        setLocalCustomStyle(customStyle);
    }, [customStyle]);

    return (
        <div className="mt-8 pt-6 border-t border-slate-700">
            <h4 className="text-lg font-semibold text-white mb-2">Atau, Tulis Gaya Kustom Anda</h4>
            <p className="text-slate-400 mb-4">Jelaskan tampilan dan nuansa yang Anda inginkan secara detail.</p>
            <textarea
                rows={3}
                value={localCustomStyle}
                onChange={(e) => setLocalCustomStyle(e.target.value)}
                onBlur={() => setCustomStyle(localCustomStyle)}
                className="block w-full bg-slate-900 border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white"
                placeholder="contoh: Gaya vintage tahun 1970-an dengan warna pudar, grain film, dan suar lensa hangat."
            />
            <Button onClick={() => onSubmit(localCustomStyle)} disabled={!localCustomStyle.trim()} className="mt-4">
                <WandIcon className="w-5 h-5"/>
                Terapkan Gaya Kustom
            </Button>
        </div>
    );
};


const AspectRatioSelector: React.FC<{
    aspectRatio: string;
    setAspectRatio: (ratio: string) => void;
}> = ({ aspectRatio, setAspectRatio }) => {
    const ratios = [
        { value: 'original', label: 'Asli' },
        { value: '1:1', label: '1:1' },
        { value: '16:9', label: '16:9' },
        { value: '9:16', label: '9:16' },
        { value: '4:3', label: '4:3' },
        { value: '3:4', label: '3:4' },
    ];

    return (
        <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
                Rasio Aspek
            </label>
            <div className="flex flex-wrap gap-2">
                {ratios.map((ratio) => (
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
    );
};

const OptionSelector: React.FC<{
    title: string;
    options: string[];
    selected: string;
    setSelected: (value: string) => void;
}> = ({ title, options, selected, setSelected }) => (
    <div>
        <h4 className="text-sm font-medium text-slate-300 mb-2">{title}</h4>
        <div className="flex flex-wrap gap-2">
            {options.map(option => (
                <button
                    key={option}
                    type="button"
                    onClick={() => setSelected(option)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        selected === option
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }`}
                >
                    {option}
                </button>
            ))}
        </div>
    </div>
);


const ImageEditor: React.FC<ImageEditorProps> = ({ initialSubjectImageUrl, onVideoRequest, onVoiceRequest, onCopywriterRequest }) => {
    const { state, setState, undo, redo, canUndo, canRedo, reset, history, currentIndex, jumpToState } = useHistoryState<EditorState>(initialEditorState);
    const {
        step,
        backgroundImage,
        subjectImage,
        customStyle,
        aspectRatio,
        finalImageUrl,
        loading,
        error,
        headline,
        tagline,
        fontStyle,
        textPlacement,
        textColor,
        textEffect,
        logoImage,
        logoPosition,
        logoScale,
        logoOpacity,
    } = state;

    useEffect(() => {
        if (initialSubjectImageUrl) {
            const convertDataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
                const res = await fetch(dataUrl);
                const blob = await res.blob();
                return new File([blob], filename, { type: blob.type });
            };

            convertDataUrlToFile(initialSubjectImageUrl, `generated-image-${Date.now()}.jpg`)
                .then(file => {
                    const imageState = { file, url: URL.createObjectURL(file) };
                    setState({ ...state, subjectImage: imageState, error: null });
                })
                .catch(err => {
                    console.error("Gagal mengonversi data URL menjadi file:", err);
                    setState({ ...state, error: "Gagal memuat gambar yang dihasilkan untuk diedit." });
                });
        }
    }, [initialSubjectImageUrl]);


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'background' | 'subject') => {
        const file = e.target.files?.[0];
        if (file) {
            const image = { file, url: URL.createObjectURL(file) };
            if (type === 'background') {
                if (backgroundImage) URL.revokeObjectURL(backgroundImage.url);
                setState({ ...state, backgroundImage: image });
            } else {
                if (subjectImage) URL.revokeObjectURL(subjectImage.url);
                setState({ ...state, subjectImage: image });
            }
        }
    };

    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const image = { file, url: URL.createObjectURL(file) };
            if (logoImage) URL.revokeObjectURL(logoImage.url);
            setState({ ...state, logoImage: image });
        }
    };

    const getPromptForStyle = (style: Style, hasBackground: boolean): string => {
        const baseMergeInstruction = `Gabungkan subjek dari gambar kedua ke latar belakang dari gambar pertama. Cocokkan pencahayaan, bayangan, dan warna agar terlihat fotorealistik. Kemudian, terapkan gaya berikut ke seluruh gambar:`;

        const baseGenerateInstruction = `Buat latar belakang baru yang fotorealistik untuk subjek dari gambar yang diberikan. Pastikan pencahayaan, bayangan, dan komposisi terlihat profesional. Latar belakang harus cocok dengan gaya berikut:`;

        const baseInstruction = hasBackground ? baseMergeInstruction : baseGenerateInstruction;
        
        let styleDescription = '';

        switch (style) {
            case 'family':
                styleDescription = `Gaya Foto Keluarga Hangat: suasana lembut dan hangat, warna-warna cerah, fokus tajam pada subjek dengan latar belakang bokeh yang lembut.`;
                break;
            case 'minimalist':
                styleDescription = `Gaya Studio Minimalis: produk ditempatkan secara artistik dengan banyak ruang negatif, latar belakang bersih, pencahayaan lembut dan merata, fokus pada bentuk dan tekstur.`;
                break;
            case 'dramatic':
                styleDescription = `Gaya Cahaya Dramatis: kontras tinggi antara terang dan gelap (chiaroscuro), bayangan yang dalam, satu sumber cahaya kuat yang menyorot subjek, menciptakan suasana misterius atau intens.`;
                break;
            case 'fantasy':
                styleDescription = `Gaya Fantasi Epik: warna-warna magis yang bersinar, elemen sureal seperti partikel cahaya atau kabut, dan lanskap dunia lain yang menakjubkan.`;
                break;
            case 'elegant':
                styleDescription = `Gaya Elegan & Mewah: gunakan tekstur seperti marmer, sutra, atau logam mulia. Palet warna monokromatik atau warna permata, pencahayaan lembut yang menonjolkan kemewahan.`;
                break;
            case 'neon':
                styleDescription = `Gaya Neon Noir: terinspirasi oleh cyberpunk, dengan lampu neon yang cerah, bayangan yang dalam, dan suasana malam perkotaan yang basah oleh hujan.`;
                break;
            case 'cosmic':
                styleDescription = `Gaya Kosmik & Galaksi: latar belakang nebula, bintang, dan galaksi. Warna biru tua, ungu, dan merah muda, dengan efek cahaya seperti bintang jatuh atau aurora.`;
                break;
            case 'aquatic':
                styleDescription = `Gaya Bawah Air yang Tenang: pemandangan bawah air dengan sinar matahari yang menembus permukaan, gelembung udara, dan kehidupan laut. Warna biru dan hijau yang menenangkan.`;
                break;
            case 'deco':
                styleDescription = `Gaya Art Deco: pola geometris yang berani, garis-garis yang kuat, dan aksen emas atau perak. Terinspirasi oleh arsitektur dan desain tahun 1920-an.`;
                break;
            case 'professionalCinematic':
                styleDescription = `Gaya Sinematik Profesional: pencahayaan kelas atas, gradasi warna profesional, dan komposisi yang cermat untuk menciptakan tampilan seperti adegan dari film blockbuster.`;
                break;
        }

        let ratioInstruction = '';
        if (aspectRatio !== 'original') {
            ratioInstruction = `Pastikan gambar akhir memiliki rasio aspek ${aspectRatio}.`;
        }
        
        return `${baseInstruction} ${styleDescription} ${ratioInstruction}`;
    };

    const handleStyleSelection = async (style: Style | 'custom') => {
        if (!subjectImage) {
            setState({ ...state, error: 'Silakan unggah gambar subjek terlebih dahulu.' });
            return;
        }

        const promptText = style === 'custom'
            ? customStyle
            : getPromptForStyle(style, !!backgroundImage);

        if (!promptText) {
            setState({ ...state, error: 'Gaya kustom tidak boleh kosong.' });
            return;
        }

        setState({ ...state, loading: true, error: null, step: 'processing' });

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const promptParts: any[] = [];

            if (backgroundImage) {
                const bgBase64 = await fileToBase64(backgroundImage.file);
                promptParts.push({ inlineData: { data: bgBase64, mimeType: backgroundImage.file.type } });
            }

            const subjectBase64 = await fileToBase64(subjectImage.file);
            promptParts.push({ inlineData: { data: subjectBase64, mimeType: subjectImage.file.type } });
            
            promptParts.push({ text: promptText });

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: promptParts },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });
            
            const part = response.candidates?.[0]?.content?.parts?.[0];

            if (part?.inlineData) {
                const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                setState({ ...state, finalImageUrl: imageUrl, loading: false, step: 'result' });
            } else {
                throw new Error('Gagal memproses gambar. Respons AI tidak berisi gambar.');
            }

        } catch (err: any) {
            setState({ ...state, error: err.message || 'Terjadi kesalahan saat memproses gambar.', loading: false, step: subjectImage ? (backgroundImage ? 'style' : 'productStyle') : 'upload' });
            console.error(err);
        }
    };
    
    const handleNextStep = (nextStep: Step) => {
        setState({ ...state, step: nextStep, error: null });
    };

    const textEffects = ['Tanpa Efek', 'Efek Bayangan', 'Efek Outline', 'Teks 3D', 'Gradien Lembut'];
    const fontStyles = ['Serif elegan', 'Sans-serif modern', 'Tulisan tangan kasual', 'Skrip formal', 'Gaya Retro'];
    const textPlacements = ['Tengah', 'Tengah atas', 'Tengah bawah', 'Pojok kiri atas', 'Pojok kanan atas', 'Pojok kiri bawah', 'Pojok kanan bawah'];
    const textColors = ['Putih solid', 'Hitam solid', 'Emas', 'Perak', 'Merah cerah', 'Biru elektrik'];

    const handleApplyText = async () => {
        if (!finalImageUrl) {
            setState({ ...state, error: 'Tidak ada gambar untuk ditambahkan teks.' });
            return;
        }
        setState({ ...state, loading: true, error: null, step: 'processingText' });

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const response = await fetch(finalImageUrl);
            const blob = await response.blob();
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = reject;
            });

            const imagePart = { inlineData: { data: base64Data, mimeType: blob.type } };

            let textPrompt = `
            Anda adalah seorang desainer grafis AI yang sangat akurat. Tugas utama Anda adalah menambahkan teks ke gambar yang diberikan. Akurasi teks adalah prioritas tertinggi.

            Gambar asli adalah gambar pertama dalam input.

            **Instruksi Teks:**
            - **Headline:** "${headline}"
            - **Tagline:** "${tagline || 'Tidak ada'}"
            - **Gaya Font:** ${fontStyle}
            - **Penempatan:** ${textPlacement}
            - **Warna Teks:** ${textColor}
            - **Efek Teks:** ${textEffect}

            **Aturan Kritis (HARUS DIIKUTI):**
            - **RENDER TEKS SECARA HARFIAH:** Tuliskan teks "Headline" dan "Tagline" PERSIS seperti yang tertulis di atas, huruf demi huruf. JANGAN mengubah, mengoreksi, menerjemahkan, atau memparafrasekan teks dalam cara apa pun. Abaikan potensi kesalahan ketik; salin saja teksnya.
            - **EFEK SPESIFIK:**
                - Jika Efek Teks adalah **'Teks 3D'**: Berikan teks efek kedalaman yang realistis, lengkap dengan pencahayaan dan bayangan cerdas yang tampak menyatu dengan pencahayaan gambar.
                - Jika Efek Teks adalah **'Gradien Lembut'**: Terapkan gradasi warna yang halus pada teks. Jika memungkinkan, ambil warna dari gambar untuk menciptakan gradien yang harmonis.
                - Jika Efek Teks adalah **'Efek Bayangan'** atau **'Efek Outline'**: Terapkan efek ini secara halus dan profesional untuk meningkatkan keterbacaan tanpa mengalahkan teks itu sendiri.
            - **INTEGRASI VISUAL:** Pastikan teks mudah dibaca dan terintegrasi secara mulus dengan gambar asli.
            - **FOKUS HANYA PADA TEKS:** Jangan menambahkan, mengubah, atau menghapus elemen lain dari gambar asli.
            - **PERTAHANKAN RASIO ASPEK:** Output harus berupa gambar dengan rasio aspek yang sama dengan gambar asli.
            `;

            const textPart = { text: textPrompt };

            const genResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [imagePart, textPart] },
                config: { responseModalities: [Modality.IMAGE] },
            });

            const part = genResponse.candidates?.[0]?.content?.parts?.[0];
            if (part?.inlineData) {
                const newImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                setState({ ...state, finalImageUrl: newImageUrl, loading: false, step: 'finalResult' });
            } else {
                throw new Error('Gagal menambahkan teks. Respons AI tidak berisi gambar.');
            }

        } catch (err: any) {
            setState({ ...state, error: err.message || 'Terjadi kesalahan saat menambahkan teks.', loading: false, step: 'text' });
            console.error(err);
        }
    };
    
    const handleApplyLogo = async () => {
         if (!finalImageUrl || !logoImage) {
            setState({ ...state, error: 'Silakan unggah gambar dan logo terlebih dahulu.' });
            return;
        }
        setState({ ...state, loading: true, error: null, step: 'processingLogo' });

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            
            const response = await fetch(finalImageUrl);
            const blob = await response.blob();
            const base64Data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                reader.onerror = reject;
            });
            const imagePart = { inlineData: { data: base64Data, mimeType: blob.type } };

            const logoBase64 = await fileToBase64(logoImage.file);
            const logoPart = { inlineData: { data: logoBase64, mimeType: logoImage.file.type } };
            
            const promptText = `
            Anda adalah seorang ahli branding AI. Tugas Anda adalah menempatkan logo (gambar kedua) ke gambar utama (gambar pertama).

            **Instruksi Penempatan Logo:**
            - **Posisi:** ${logoPosition}
            - **Skala/Ukuran:** Logo harus menempati sekitar ${logoScale}% dari lebar gambar utama.
            - **Transparansi/Opasitas:** ${logoOpacity}%
            - **Aturan:** Jaga latar belakang logo tetap transparan jika memungkinkan. Jangan mengubah gambar utama selain menambahkan logo.
            - **Output:** Hasilkan gambar akhir dengan rasio aspek yang sama dengan gambar utama.
            `;

            const textPart = { text: promptText };

            const genResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: [imagePart, logoPart, textPart] },
                config: { responseModalities: [Modality.IMAGE] },
            });

            const part = genResponse.candidates?.[0]?.content?.parts?.[0];
            if (part?.inlineData) {
                const newImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                 setState({ ...state, finalImageUrl: newImageUrl, loading: false, step: 'finalResult' });
            } else {
                throw new Error('Gagal menambahkan logo. Respons AI tidak berisi gambar.');
            }
        } catch (err: any) {
            setState({ ...state, error: err.message || 'Terjadi kesalahan saat menambahkan logo.', loading: false, step: 'logo' });
            console.error(err);
        }
    }

    const startOver = () => {
        if (subjectImage?.url) URL.revokeObjectURL(subjectImage.url);
        if (backgroundImage?.url) URL.revokeObjectURL(backgroundImage.url);
        reset(initialEditorState);
    };

    const renderStep = () => {
        if (loading) {
            return (
                <Card className="flex flex-col items-center justify-center text-center p-8 min-h-[300px]">
                    <Spinner className="w-10 h-10 mb-4" />
                    <p className="text-lg font-semibold text-white">AI sedang bekerja...</p>
                    <p className="text-slate-400">Harap tunggu sebentar, keajaiban sedang dibuat.</p>
                </Card>
            );
        }

        switch (step) {
            case 'upload':
            case 'style':
            case 'productStyle':
                 const nextDisabled = !subjectImage;
                 const nextStepTarget = subjectImage && backgroundImage ? 'style' : (subjectImage ? 'productStyle' : 'upload');
                return (
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Langkah 1: Unggah Gambar</h3>
                        <p className="text-slate-400 mb-6">Pilih gambar produk atau subjek utama. Anda juga dapat menambahkan gambar latar belakang (opsional).</p>
                        <div className="flex flex-col md:flex-row gap-4">
                            <ImageUploadBox title="Subjek / Produk Utama (Wajib)" description="File PNG, JPG, WEBP hingga 10MB" image={subjectImage} onFileChange={(e) => handleFileChange(e, 'subject')} id="subject-upload" />
                            <ImageUploadBox title="Latar Belakang (Opsional)" description="File PNG, JPG, WEBP hingga 10MB" image={backgroundImage} onFileChange={(e) => handleFileChange(e, 'background')} id="background-upload" />
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button onClick={() => handleNextStep(nextStepTarget)} disabled={nextDisabled}>
                                Lanjut ke Pemilihan Gaya
                            </Button>
                        </div>
                    </Card>
                );
            case 'processing':
            case 'result':
            case 'finalResult':
                 const isFinal = step === 'finalResult';
                return (
                    <Card>
                         <h3 className="text-lg font-semibold text-white mb-2">{isFinal ? "Gambar Akhir Anda" : "Hasil Edit Gaya"}</h3>
                         <p className="text-slate-400 mb-6">{isFinal ? "Gambar Anda siap diunduh atau digunakan lebih lanjut." : "Pilih langkah selanjutnya atau kembali untuk mencoba gaya lain."}</p>
                        {finalImageUrl && <img src={finalImageUrl} alt="Hasil akhir" className="rounded-lg w-full object-contain mb-6" />}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                            <a href={finalImageUrl ?? '#'} download={`canvas-ai-edited-${Date.now()}.png`}>
                                <Button variant="secondary" className="w-full">
                                    <DownloadIcon className="w-5 h-5"/>
                                    <span>Unduh</span>
                                </Button>
                            </a>
                            <Button onClick={() => handleNextStep('text')} className="w-full">
                                Tambah/Ubah Teks
                            </Button>
                            <Button onClick={() => handleNextStep('logo')} className="w-full">
                                Tambah Logo
                            </Button>
                             {onVideoRequest && finalImageUrl && (
                                <Button onClick={() => onVideoRequest(finalImageUrl)} className="w-full">
                                    <VideoIcon className="w-5 h-5"/>
                                    <span>Buat Video</span>
                                </Button>
                             )}
                        </div>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                             {finalImageUrl && <VoiceOverGeneratorButton imageUrl={finalImageUrl} onVoiceRequest={onVoiceRequest!} />}
                             {finalImageUrl && <CopywriterButton imageUrl={finalImageUrl} onCopywriterRequest={onCopywriterRequest!} />}
                             {finalImageUrl && <PromotionGenerator imageUrl={finalImageUrl} />}
                        </div>
                    </Card>
                );

            case 'text':
                return (
                     <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Langkah 3: Tambah Teks Iklan</h3>
                        <p className="text-slate-400 mb-6">Tulis headline dan tagline Anda, lalu pilih gaya yang paling sesuai.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <label htmlFor="headline" className="block text-sm font-medium text-slate-300">Headline</label>
                                <input type="text" id="headline" value={headline} onChange={e => setState({...state, headline: e.target.value})} className="mt-1 block w-full bg-slate-900 border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white" />
                            </div>
                            <div>
                                <label htmlFor="tagline" className="block text-sm font-medium text-slate-300">Tagline (Opsional)</label>
                                <input type="text" id="tagline" value={tagline} onChange={e => setState({...state, tagline: e.target.value})} className="mt-1 block w-full bg-slate-900 border-slate-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-white" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <OptionSelector title="Gaya Font" options={fontStyles} selected={fontStyle} setSelected={(value) => setState({...state, fontStyle: value})} />
                            <OptionSelector title="Penempatan Teks" options={textPlacements} selected={textPlacement} setSelected={(value) => setState({...state, textPlacement: value})} />
                            <OptionSelector title="Warna Teks" options={textColors} selected={textColor} setSelected={(value) => setState({...state, textColor: value})} />
                            <OptionSelector title="Efek Teks" options={textEffects} selected={textEffect} setSelected={(value) => setState({...state, textEffect: value})} />
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button onClick={handleApplyText}>
                                <WandIcon className="w-5 h-5" />
                                Terapkan Teks
                            </Button>
                        </div>
                     </Card>
                );
            case 'logo':
                return(
                    <Card>
                        <h3 className="text-lg font-semibold text-white mb-2">Langkah 4: Tambah Logo</h3>
                        <p className="text-slate-400 mb-6">Unggah file logo Anda (disarankan PNG transparan) dan atur penempatannya.</p>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">File Logo</label>
                                {logoImage ? (
                                    <div className="flex items-center gap-4">
                                        <img src={logoImage.url} alt="Pratinjau logo" className="h-16 w-auto bg-slate-700 p-1 rounded"/>
                                        <label htmlFor="logo-upload" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 cursor-pointer">
                                            Ganti Logo
                                            <input id="logo-upload" name="logo-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/webp" onChange={handleLogoFileChange} />
                                        </label>
                                    </div>
                                ) : (
                                    <label htmlFor="logo-upload" className="cursor-pointer flex w-full justify-center px-6 pt-5 pb-6 border-2 border-slate-600 border-dashed rounded-md">
                                        <div className="space-y-1 text-center">
                                            <ImageIcon className="mx-auto h-12 w-12 text-slate-500" />
                                            <p className="text-sm text-slate-400">Pilih file logo</p>
                                        </div>
                                        <input id="logo-upload" name="logo-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/webp" onChange={handleLogoFileChange} />
                                    </label>
                                )}
                            </div>
                            <OptionSelector title="Posisi Logo" options={['Pojok kiri atas', 'Pojok kanan atas', 'Pojok kiri bawah', 'Pojok kanan bawah', 'Tengah']} selected={logoPosition} setSelected={(value) => setState({...state, logoPosition: value})} />
                             <div>
                                <label htmlFor="logo-scale" className="block text-sm font-medium text-slate-300">Ukuran Logo ({logoScale}%)</label>
                                <input id="logo-scale" type="range" min="5" max="50" value={logoScale} onChange={e => setState({...state, logoScale: parseInt(e.target.value)})} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                            </div>
                            <div>
                                <label htmlFor="logo-opacity" className="block text-sm font-medium text-slate-300">Transparansi Logo ({logoOpacity}%)</label>
                                <input id="logo-opacity" type="range" min="10" max="100" value={logoOpacity} onChange={e => setState({...state, logoOpacity: parseInt(e.target.value)})} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end">
                            <Button onClick={handleApplyLogo} disabled={!logoImage}>
                                <WandIcon className="w-5 h-5" />
                                Terapkan Logo
                            </Button>
                        </div>
                    </Card>
                );
        }

        const StyleButton: React.FC<{ style: Style, icon: React.FC<{className?:string}>, label: string }> = ({ style, icon: Icon, label }) => (
            <button onClick={() => handleStyleSelection(style)} className="flex flex-col items-center justify-center space-y-2 p-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-all text-center">
                <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center text-indigo-400">
                    <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-slate-300">{label}</span>
            </button>
        );

        return (
            <Card>
                <h3 className="text-lg font-semibold text-white mb-2">Langkah 2: Pilih Gaya</h3>
                <p className="text-slate-400 mb-6">
                    {backgroundImage
                        ? 'Pilih gaya untuk menggabungkan subjek dan latar belakang Anda secara mulus.'
                        : 'Pilih gaya latar belakang yang akan dibuat AI untuk produk Anda.'
                    }
                </p>
                <AspectRatioSelector aspectRatio={aspectRatio} setAspectRatio={(val) => setState({ ...state, aspectRatio: val })} />

                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    <StyleButton style="professionalCinematic" icon={ClapperboardIcon} label="Sinematik Pro" />
                    <StyleButton style="minimalist" icon={DiamondIcon} label="Studio Minimalis" />
                    <StyleButton style="elegant" icon={PillarIcon} label="Elegan & Mewah" />
                    <StyleButton style="family" icon={HeartIcon} label="Keluarga Hangat" />
                    <StyleButton style="dramatic" icon={SpotlightIcon} label="Cahaya Dramatis" />
                    <StyleButton style="fantasy" icon={StarsIcon} label="Fantasi Epik" />
                    <StyleButton style="neon" icon={NeonIcon} label="Neon Noir" />
                    <StyleButton style="cosmic" icon={PlanetIcon} label="Kosmik" />
                    <StyleButton style="aquatic" icon={WaterDropIcon} label="Bawah Air" />
                    <StyleButton style="deco" icon={FanIcon} label="Art Deco" />
                </div>
                 <CustomStyleInput
                    customStyle={customStyle}
                    setCustomStyle={(val) => setState({ ...state, customStyle: val })}
                    onSubmit={() => handleStyleSelection('custom')}
                />
            </Card>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Editor Gambar Cerdas</h2>
                    <p className="mt-2 text-lg text-slate-400">
                        Gabungkan gambar, buat latar belakang baru, tambahkan teks, dan lainnya.
                    </p>
                </div>
                <Button variant="secondary" onClick={startOver}>Mulai dari Awal</Button>
            </div>

            {error && (
                <div className="bg-red-900/50 border-red-700 text-red-300 px-4 py-3 rounded-md mb-6">
                    <p>{error}</p>
                </div>
            )}
            
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-grow">
                    {renderStep()}
                </div>
                <HistorySidebar
                    history={history}
                    currentIndex={currentIndex}
                    onJump={jumpToState}
                    onUndo={undo}
                    canUndo={canUndo}
                    onRedo={redo}
                    canRedo={canRedo}
                />
            </div>
        </div>
    );
};

export default ImageEditor;