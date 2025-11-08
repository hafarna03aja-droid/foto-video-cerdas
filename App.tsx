import React, { useState } from 'react';
import { Tool } from './types';
import Header from './components/Header';
import ImageGenerator from './components/ImageGenerator';
import ImageEditor from './components/ImageEditor';
import VideoGenerator from './components/VideoGenerator';
import VoiceGenerator from './components/VoiceGenerator';
import CopywriterAssistant from './components/CopywriterAssistant';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<Tool>(Tool.ImageGeneration);
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const [imageForVideo, setImageForVideo] = useState<string | null>(null);
  const [textForVoice, setTextForVoice] = useState<string | null>(null);
  const [initialCopywriterPrompt, setInitialCopywriterPrompt] = useState<string | null>(null);


  const handleEditRequest = (imageUrl: string) => {
    setImageToEdit(imageUrl);
    setActiveTool(Tool.ImageEditor);
  };

  const handleVideoRequest = (imageUrl: string) => {
    setImageForVideo(imageUrl);
    setActiveTool(Tool.VideoGeneration);
  };

  const handleVoiceRequest = (text: string) => {
    setTextForVoice(text);
    setActiveTool(Tool.VoiceGeneration);
  };

  const handleCopywriterRequest = (prompt: string) => {
    setInitialCopywriterPrompt(prompt);
    setActiveTool(Tool.Copywriter);
  };
  
  const handleToolChange = (tool: Tool) => {
    if (tool !== Tool.ImageEditor) {
        setImageToEdit(null);
    }
    if (tool !== Tool.VideoGeneration) {
        setImageForVideo(null);
    }
    if (tool !== Tool.VoiceGeneration) {
        setTextForVoice(null);
    }
    if (tool !== Tool.Copywriter) {
        setInitialCopywriterPrompt(null);
    }
    setActiveTool(tool);
  };


  const renderActiveTool = () => {
    switch (activeTool) {
      case Tool.ImageGeneration:
        return <ImageGenerator onEditRequest={handleEditRequest} onVoiceRequest={handleVoiceRequest} onCopywriterRequest={handleCopywriterRequest} />;
      case Tool.ImageEditor:
        return <ImageEditor initialSubjectImageUrl={imageToEdit} onVideoRequest={handleVideoRequest} onVoiceRequest={handleVoiceRequest} onCopywriterRequest={handleCopywriterRequest} />;
      case Tool.VideoGeneration:
        return <VideoGenerator initialImageUrl={imageForVideo} />;
      case Tool.VoiceGeneration:
        return <VoiceGenerator initialText={textForVoice} />;
      case Tool.Copywriter:
        return <CopywriterAssistant initialPrompt={initialCopywriterPrompt} />;
      default:
        return <ImageGenerator onEditRequest={handleEditRequest} onVoiceRequest={handleVoiceRequest} onCopywriterRequest={handleCopywriterRequest} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col">
      <Header activeTool={activeTool} setActiveTool={handleToolChange} />
      <main className="flex-grow p-4 md:p-8 flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex-grow flex flex-col">
          {renderActiveTool()}
        </div>
      </main>
      <footer className="text-center p-4 text-xs text-slate-500">
        <p>Foto Video Cerdas. Didukung oleh 24 Learning Centre.</p>
      </footer>
    </div>
  );
};

export default App;