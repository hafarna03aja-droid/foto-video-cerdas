import React from 'react';
import { Tool } from '../types';
import { ImageIcon, WandIcon, VideoIcon, MicIcon, MessageCircleIcon, SparklesIcon } from './icons';

interface HeaderProps {
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;
}

const tools = [
  { id: Tool.ImageGeneration, name: 'Buat Gambar', icon: ImageIcon },
  { id: Tool.ImageEditor, name: 'Edit Gambar', icon: WandIcon },
  { id: Tool.VideoGeneration, name: 'Buat Video', icon: VideoIcon },
  { id: Tool.VoiceGeneration, name: 'Buat Suara', icon: MicIcon },
  { id: Tool.Copywriter, name: 'Asisten Penulis', icon: MessageCircleIcon },
];

const Header: React.FC<HeaderProps> = ({ activeTool, setActiveTool }) => {
  
  return (
    <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-3">
            <SparklesIcon className="h-8 w-8 text-indigo-400" />
            <h1 className="text-2xl font-bold text-slate-100">Foto Video Cerdas</h1>
          </div>
          <div className="flex items-center">
            <nav className="hidden md:flex space-x-1">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${activeTool === tool.id
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                  <tool.icon className="h-5 w-5" />
                  {tool.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
        <div className="md:hidden pb-3">
            <nav className="flex space-x-2 overflow-x-auto">
                {tools.map((tool) => (
                <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`flex-shrink-0 flex items-center gap-2 px-2 md:px-3 py-2 text-sm font-medium rounded-md transition-colors
                    ${activeTool === tool.id
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                    <tool.icon className="h-5 w-5" />
                    {tool.name}
                </button>
                ))}
            </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;