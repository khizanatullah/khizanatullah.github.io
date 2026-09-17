import React, { useState } from 'react';
import { STICKER_LIST, STICKER_MAP, StickerItem, StickerVisual } from './Stickers';
import { X, Sparkles, Heart, Smile, Coffee } from 'lucide-react';

interface StickerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSticker: (sticker: StickerItem) => void;
  theme: {
    primary: string;
    border: string;
    shadow: string;
    textDark: string;
  };
}

export const StickerPicker: React.FC<StickerPickerProps> = ({
  isOpen,
  onClose,
  onSelectSticker,
  theme
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'happy' | 'love' | 'reaction' | 'mood'>('all');
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filteredStickers = STICKER_LIST.filter(s => {
    const matchesTab = activeTab === 'all' || s.category === activeTab;
    const matchesSearch = !search.trim() || 
      s.name.toLowerCase().includes(search.toLowerCase()) || 
      s.label.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white rounded-3xl border-3 overflow-hidden shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[560px] animate-in slide-in-from-bottom-4 duration-200"
        style={{ borderColor: theme.border, boxShadow: `6px 6px 0px ${theme.shadow}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 bg-violet-50/70" style={{ borderColor: theme.border }}>
          <div className="flex items-center gap-2">
            <span className="text-xl">🐱</span>
            <div>
              <h3 className="text-sm font-black tracking-wide" style={{ color: theme.textDark }}>
                Stiker Lucu Violet AI
              </h3>
              <p className="text-[11px] text-zinc-500 font-medium">
                Kirim stiker anime cat ke Violet (dan Violet juga bisa balas pakai stiker!)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white rounded-xl border border-transparent hover:border-zinc-300 transition-colors text-zinc-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b bg-zinc-50 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'all' 
                ? 'bg-violet-600 text-white shadow-xs' 
                : 'text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Semua ({STICKER_LIST.length})
          </button>
          <button
            onClick={() => setActiveTab('happy')}
            className={`flex items-center gap-1 px-3 py-1 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'happy' 
                ? 'bg-amber-500 text-white shadow-xs' 
                : 'text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            <Smile className="w-3.5 h-3.5" />
            Ceria
          </button>
          <button
            onClick={() => setActiveTab('love')}
            className={`flex items-center gap-1 px-3 py-1 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'love' 
                ? 'bg-rose-500 text-white shadow-xs' 
                : 'text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            <Heart className="w-3.5 h-3.5" />
            Cinta
          </button>
          <button
            onClick={() => setActiveTab('reaction')}
            className={`flex items-center gap-1 px-3 py-1 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'reaction' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Reaksi
          </button>
          <button
            onClick={() => setActiveTab('mood')}
            className={`flex items-center gap-1 px-3 py-1 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === 'mood' 
                ? 'bg-purple-600 text-white shadow-xs' 
                : 'text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            Mood
          </button>
        </div>

        {/* Sticker Grid */}
        <div className="p-3 overflow-y-auto flex-1 grid grid-cols-3 sm:grid-cols-4 gap-2.5 bg-zinc-50/50">
          {filteredStickers.map(sticker => (
            <button
              key={sticker.id}
              onClick={() => {
                onSelectSticker(sticker);
                onClose();
              }}
              className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white border border-zinc-200/90 hover:border-violet-500 hover:bg-violet-50/50 hover:shadow-md transition-all group"
            >
              <StickerVisual id={sticker.id} size={74} animate={false} />
            </button>
          ))}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t text-[11px] text-zinc-500 bg-white flex items-center justify-between">
          <span>Tips: Klik stiker untuk langsung mengirimkannya!</span>
          <span className="font-bold text-violet-600">16 Stiker Tersedia</span>
        </div>
      </div>
    </div>
  );
};
