import React from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { UndoIcon, RedoIcon } from './icons';
import { EditorState } from './ImageEditor';

interface HistorySidebarProps {
  history: EditorState[];
  currentIndex: number;
  onJump: (index: number) => void;
  onUndo: () => void;
  canUndo: boolean;
  onRedo: () => void;
  canRedo: boolean;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  history,
  currentIndex,
  onJump,
  onUndo,
  canUndo,
  onRedo,
  canRedo
}) => {
    
  let imageStepCounter = 0;

  return (
    <div className="w-full lg:w-64 flex-shrink-0">
      <Card className="sticky top-24">
        <h3 className="font-semibold text-white mb-4">Riwayat Pengeditan</h3>
        <div className="flex gap-2 mb-4">
          <Button variant="secondary" onClick={onUndo} disabled={!canUndo} aria-label="Undo" className="flex-1 justify-center">
            <UndoIcon className="w-5 h-5"/>
          </Button>
          <Button variant="secondary" onClick={onRedo} disabled={!canRedo} aria-label="Redo" className="flex-1 justify-center">
            <RedoIcon className="w-5 h-5"/>
          </Button>
        </div>
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 -mr-4">
          {history.map((histState, index) => {
            if (!histState.finalImageUrl) {
              return null;
            }

            imageStepCounter++;
            const isCurrent = index === currentIndex;

            return (
              <button
                key={index}
                onClick={() => onJump(index)}
                className={`w-full p-1.5 rounded-md transition-all text-left ${isCurrent ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                <img src={histState.finalImageUrl} alt={`Riwayat langkah ${imageStepCounter}`} className="w-full h-auto object-cover rounded-sm" />
                <p className={`text-xs mt-2 font-semibold ${isCurrent ? 'text-white' : 'text-slate-300'}`}>
                  Langkah {imageStepCounter}
                </p>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default HistorySidebar;
