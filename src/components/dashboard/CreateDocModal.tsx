import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';

export const CreateDocModal = ({ isOpen, onClose, onCreate }: { isOpen: boolean, onClose: () => void, onCreate: (title: string) => void }) => {
  const [title, setTitle] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-gray-800 w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Create new doc</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={20}/></button>
        </div>
        
        <input 
          autoFocus
          type="text"
          placeholder="Document title (e.g. Raspberry Pi Monitoring)"
          className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-white mb-6 outline-none focus:border-blue-500 transition-all"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <div className="flex gap-3">
          <Button variant="dark" onClick={onClose} className="flex-1">Cancel</Button>
          <Button 
            variant="primary" 
            className="flex-1"
            onClick={() => { if(title) { onCreate(title); setTitle(''); onClose(); } }}
          >
            Create doc
          </Button>
        </div>
      </div>
    </div>
  );
};