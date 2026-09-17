import React from 'react';

export interface StickerItem {
  id: string;
  name: string;
  category: 'happy' | 'love' | 'reaction' | 'mood';
  label: string;
  emoji: string;
}

export const STICKER_LIST: StickerItem[] = [
  { id: 'cat_hi', name: 'Halo Nya~!', category: 'happy', label: 'Menyapa dengan hangat', emoji: '👋' },
  { id: 'cat_happy', name: 'Senang Banget!', category: 'happy', label: 'Tertawa ceria & gembira', emoji: '✨' },
  { id: 'cat_love', name: 'Sayang Kamu!', category: 'love', label: 'Penuh cinta & hati manis', emoji: '💖' },
  { id: 'cat_wink', name: 'Kedip Manja', category: 'happy', label: 'Mengedip nakal nan imut', emoji: '😉' },
  { id: 'cat_cheer', name: 'Semangat Nya~!', category: 'happy', label: 'Ganbatte & penuh energi', emoji: '🔥' },
  { id: 'cat_smart', name: 'Paham / Jenius', category: 'reaction', label: 'Kacamata pintar berkilau', emoji: '💡' },
  { id: 'cat_thumbsup', name: 'Mantap / Siip!', category: 'reaction', label: 'Jempol jempol mantap', emoji: '👍' },
  { id: 'cat_hug', name: 'Peluk Erat', category: 'love', label: 'Minta pelukan hangat', emoji: '🤗' },
  { id: 'cat_shock', name: 'Kaget Banget?!', category: 'reaction', label: 'Terkejut mata membelalak', emoji: '⚡' },
  { id: 'cat_cry', name: 'Sedih / Huwaa', category: 'mood', label: 'Menangis tersedu-sedu', emoji: '💧' },
  { id: 'cat_sleepy', name: 'Ngantuk / Zzz', category: 'mood', label: 'Mengantuk mau tidur', emoji: '💤' },
  { id: 'cat_snack', name: 'Nyam Ikan Lezat', category: 'mood', label: 'Menikmati camilan ikan', emoji: '🐟' },
  { id: 'cat_cool', name: 'Keren / Santai', category: 'reaction', label: 'Kacamata hitam gaya keren', emoji: '😎' },
  { id: 'cat_pout', name: 'Merajuk / Hmph!', category: 'mood', label: 'Pipi gembul ngambek lucu', emoji: '😤' },
  { id: 'cat_coffee', name: 'Ngopi Santai', category: 'mood', label: 'Menikmati cangkir teh/kopi hangat', emoji: '☕' },
  { id: 'cat_pat', name: 'Elus / Puk-puk', category: 'love', label: 'Nyaman dielus kepalanya', emoji: '🌸' },
];

export const STICKER_MAP = new Map<string, StickerItem>(
  STICKER_LIST.map(s => [s.id, s])
);

interface StickerProps {
  id: string;
  size?: number;
  className?: string;
  animate?: boolean;
}

export const StickerVisual: React.FC<StickerProps> = ({ id, size = 110, className = '', animate = true }) => {
  const sticker = STICKER_MAP.get(id);

  // SVG-based high-definition anime cat sticker graphics
  const renderStickerIllustration = () => {
    switch (id) {
      case 'cat_hi':
        return (
          <g>
            {/* Body & Ears */}
            <path d="M 40 85 C 40 55, 80 55, 80 85 Z" fill="#e9d5ff" />
            <ellipse cx="60" cy="58" rx="34" ry="28" fill="#f5f3ff" stroke="#7c3aed" strokeWidth="2.5" />
            {/* Left Ear */}
            <polygon points="32,42 22,18 46,30" fill="#ddd6fe" stroke="#7c3aed" strokeWidth="2.5" strokeLinejoin="round" />
            <polygon points="33,40 26,24 43,32" fill="#f472b6" />
            {/* Right Ear */}
            <polygon points="88,42 98,18 74,30" fill="#ddd6fe" stroke="#7c3aed" strokeWidth="2.5" strokeLinejoin="round" />
            <polygon points="87,40 94,24 77,32" fill="#f472b6" />
            {/* Waving Paw */}
            <circle cx="22" cy="52" r="9" fill="#ede9fe" stroke="#7c3aed" strokeWidth="2" />
            <ellipse cx="19" cy="48" rx="2" ry="3" fill="#f472b6" />
            <ellipse cx="23" cy="46" rx="2" ry="3" fill="#f472b6" />
            <ellipse cx="27" cy="49" rx="2" ry="3" fill="#f472b6" />
            <ellipse cx="22" cy="54" rx="4" ry="3" fill="#f472b6" />
            {/* Eyes */}
            <path d="M 44 54 Q 50 48 54 54" fill="none" stroke="#6d28d9" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 66 54 Q 70 48 76 54" fill="none" stroke="#6d28d9" strokeWidth="3.5" strokeLinecap="round" />
            {/* Cheeks */}
            <circle cx="42" cy="62" r="5" fill="#f472b6" opacity="0.6" />
            <circle cx="78" cy="62" r="5" fill="#f472b6" opacity="0.6" />
            {/* Nose & Mouth */}
            <polygon points="58,60 62,60 60,63" fill="#ec4899" />
            <path d="M 56 64 Q 60 68 64 64" fill="none" stroke="#6d28d9" strokeWidth="2" strokeLinecap="round" />
            {/* Sparkles */}
            <text x="82" y="30" fontSize="16">✨</text>
          </g>
        );

      case 'cat_love':
        return (
          <g>
            <ellipse cx="60" cy="58" rx="34" ry="28" fill="#fdf2f8" stroke="#db2777" strokeWidth="2.5" />
            <polygon points="32,42 20,20 46,30" fill="#fbcfe8" stroke="#db2777" strokeWidth="2.5" strokeLinejoin="round" />
            <polygon points="33,40 25,25 43,32" fill="#f472b6" />
            <polygon points="88,42 100,20 74,30" fill="#fbcfe8" stroke="#db2777" strokeWidth="2.5" strokeLinejoin="round" />
            <polygon points="87,40 95,25 77,32" fill="#f472b6" />
            {/* Heart Eyes */}
            <text x="39" y="58" fontSize="16" fill="#ec4899">❤️</text>
            <text x="63" y="58" fontSize="16" fill="#ec4899">❤️</text>
            {/* Cheeks */}
            <circle cx="38" cy="65" r="6" fill="#fb7185" opacity="0.7" />
            <circle cx="82" cy="65" r="6" fill="#fb7185" opacity="0.7" />
            {/* Mouth */}
            <path d="M 54 67 Q 60 74 66 67" fill="#fda4af" stroke="#be185d" strokeWidth="2" />
            {/* Huge Glowing Heart */}
            <path d="M 60 72 C 45 55, 30 70, 60 92 C 90 70, 75 55, 60 72 Z" fill="#f43f5e" stroke="#fff" strokeWidth="2" />
            <text x="53" y="84" fontSize="12" fill="#fff">💖</text>
          </g>
        );

      case 'cat_happy':
        return (
          <g>
            <ellipse cx="60" cy="58" rx="34" ry="28" fill="#fffbeb" stroke="#d97706" strokeWidth="2.5" />
            <polygon points="32,42 22,18 46,30" fill="#fef3c7" stroke="#d97706" strokeWidth="2.5" strokeLinejoin="round" />
            <polygon points="33,40 26,24 43,32" fill="#fbbf24" />
            <polygon points="88,42 98,18 74,30" fill="#fef3c7" stroke="#d97706" strokeWidth="2.5" strokeLinejoin="round" />
            <polygon points="87,40 94,24 77,32" fill="#fbbf24" />
            {/* Joyful Star Eyes */}
            <text x="40" y="56" fontSize="15" fill="#f59e0b">⭐</text>
            <text x="64" y="56" fontSize="15" fill="#f59e0b">⭐</text>
            {/* Big smiling mouth */}
            <path d="M 48 64 Q 60 78 72 64 Z" fill="#ef4444" stroke="#b45309" strokeWidth="2" />
            <path d="M 53 71 Q 60 67 67 71" fill="#fca5a5" />
            {/* Blush */}
            <ellipse cx="38" cy="63" rx="5" ry="3" fill="#f87171" opacity="0.6" />
            <ellipse cx="82" cy="63" rx="5" ry="3" fill="#f87171" opacity="0.6" />
            {/* Paws raised */}
            <circle cx="34" cy="80" r="7" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
            <circle cx="86" cy="80" r="7" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
          </g>
        );

      case 'cat_wink':
        return (
          <g>
            <ellipse cx="60" cy="58" rx="34" ry="28" fill="#fdf4ff" stroke="#a21caf" strokeWidth="2.5" />
            <polygon points="32,42 22,18 46,30" fill="#fae8ff" stroke="#a21caf" strokeWidth="2.5" strokeLinejoin="round" />
            <polygon points="33,40 26,24 43,32" fill="#f472b6" />
            <polygon points="88,42 98,18 74,30" fill="#fae8ff" stroke="#a21caf" strokeWidth="2.5" strokeLinejoin="round" />
            <polygon points="87,40 94,24 77,32" fill="#f472b6" />
            {/* One open eye, one winking line */}
            <circle cx="48" cy="52" r="5.5" fill="#701a75" />
            <circle cx="49.5" cy="50.5" r="2" fill="#fff" />
            <path d="M 68 53 Q 74 46 80 53" fill="none" stroke="#701a75" strokeWidth="3.5" strokeLinecap="round" />
            {/* Tongue out */}
            <path d="M 56 63 Q 60 68 64 63" fill="none" stroke="#701a75" strokeWidth="2" strokeLinecap="round" />
            <path d="M 59 65 C 57 73, 65 73, 63 65 Z" fill="#ec4899" stroke="#be185d" strokeWidth="1" />
            {/* Cheeks */}
            <circle cx="38" cy="62" r="5" fill="#f472b6" opacity="0.6" />
            <circle cx="82" cy="62" r="5" fill="#f472b6" opacity="0.6" />
            <text x="80" y="36" fontSize="16">✨</text>
          </g>
        );

      case 'cat_cheer':
        return (
          <g>
            <ellipse cx="60" cy="60" rx="34" ry="28" fill="#fff1f2" stroke="#e11d48" strokeWidth="2.5" />
            <polygon points="32,44 22,20 46,32" fill="#ffe4e6" stroke="#e11d48" strokeWidth="2.5" />
            <polygon points="88,44 98,20 74,32" fill="#ffe4e6" stroke="#e11d48" strokeWidth="2.5" />
            {/* White Headband with Red Sun */}
            <path d="M 28 44 Q 60 40 92 44" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" />
            <path d="M 28 44 Q 60 40 92 44" stroke="#e11d48" strokeWidth="1.5" fill="none" />
            <circle cx="60" cy="42" r="3.5" fill="#ef4444" />
            {/* Enthusiastic eyes */}
            <path d="M 44 54 Q 50 48 56 54" fill="none" stroke="#9f1239" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 64 54 Q 70 48 76 54" fill="none" stroke="#9f1239" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="40" cy="62" r="5" fill="#fda4af" />
            <circle cx="80" cy="62" r="5" fill="#fda4af" />
            {/* Pumping Paws */}
            <circle cx="28" cy="74" r="8" fill="#ffe4e6" stroke="#e11d48" strokeWidth="2" />
            <circle cx="92" cy="74" r="8" fill="#ffe4e6" stroke="#e11d48" strokeWidth="2" />
            <text x="14" y="32" fontSize="16">🔥</text>
            <text x="86" y="32" fontSize="16">🔥</text>
          </g>
        );

      case 'cat_smart':
        return (
          <g>
            <ellipse cx="60" cy="58" rx="34" ry="28" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2.5" />
            <polygon points="32,42 22,18 46,30" fill="#dcfce7" stroke="#16a34a" strokeWidth="2.5" />
            <polygon points="88,42 98,18 74,30" fill="#dcfce7" stroke="#16a34a" strokeWidth="2.5" />
            {/* Glasses */}
            <circle cx="47" cy="53" r="10" fill="none" stroke="#15803d" strokeWidth="2.5" />
            <circle cx="73" cy="53" r="10" fill="none" stroke="#15803d" strokeWidth="2.5" />
            <line x1="57" y1="53" x2="63" y2="53" stroke="#15803d" strokeWidth="2.5" />
            {/* Glint on glasses */}
            <line x1="43" y1="47" x2="49" y2="53" stroke="#86efac" strokeWidth="2" strokeLinecap="round" />
            <circle cx="73" cy="53" r="4" fill="#14532d" />
            <circle cx="74" cy="51" r="1.5" fill="#fff" />
            {/* Smug smile */}
            <path d="M 54 65 Q 60 70 66 65" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
            <text x="78" y="28" fontSize="18">💡</text>
          </g>
        );

      case 'cat_thumbsup':
        return (
          <g>
            <ellipse cx="55" cy="58" rx="32" ry="28" fill="#f8fafc" stroke="#2563eb" strokeWidth="2.5" />
            <polygon points="30,42 20,18 44,30" fill="#e2e8f0" stroke="#2563eb" strokeWidth="2.5" />
            <polygon points="80,42 90,18 68,30" fill="#e2e8f0" stroke="#2563eb" strokeWidth="2.5" />
            {/* Happy eyes */}
            <path d="M 40 54 Q 46 48 52 54" fill="none" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" />
            <path d="M 60 54 Q 66 48 72 54" fill="none" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" />
            <polygon points="54,60 58,60 56,63" fill="#3b82f6" />
            <path d="M 52 64 Q 56 68 60 64" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" />
            {/* Huge Thumbs Up Paw */}
            <g transform="translate(74, 52)">
              <circle cx="12" cy="14" r="11" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
              <rect x="7" y="2" width="8" height="12" rx="4" fill="#dbeafe" stroke="#2563eb" strokeWidth="2" />
              <text x="4" y="20" fontSize="10">👍</text>
            </g>
            <text x="14" y="32" fontSize="14">⭐</text>
          </g>
        );

      case 'cat_hug':
        return (
          <g>
            <ellipse cx="60" cy="58" rx="34" ry="28" fill="#fdf2f8" stroke="#ec4899" strokeWidth="2.5" />
            <polygon points="32,42 22,18 46,30" fill="#fce7f3" stroke="#ec4899" strokeWidth="2.5" />
            <polygon points="88,42 98,18 74,30" fill="#fce7f3" stroke="#ec4899" strokeWidth="2.5" />
            {/* Sweet closed eyes */}
            <path d="M 44 54 Q 50 49 56 54" fill="none" stroke="#be185d" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 64 54 Q 70 49 76 54" fill="none" stroke="#be185d" strokeWidth="3.5" strokeLinecap="round" />
            {/* Blushing cheeks */}
            <ellipse cx="38" cy="62" rx="6" ry="4" fill="#f472b6" opacity="0.7" />
            <ellipse cx="82" cy="62" rx="6" ry="4" fill="#f472b6" opacity="0.7" />
            {/* Hugging Paws stretched forward */}
            <ellipse cx="38" cy="74" rx="10" ry="8" fill="#fce7f3" stroke="#ec4899" strokeWidth="2" />
            <ellipse cx="82" cy="74" rx="10" ry="8" fill="#fce7f3" stroke="#ec4899" strokeWidth="2" />
            <circle cx="36" cy="73" r="2.5" fill="#f472b6" />
            <circle cx="84" cy="73" r="2.5" fill="#f472b6" />
            <text x="51" y="44" fontSize="16">🌸</text>
          </g>
        );

      case 'cat_shock':
        return (
          <g>
            <ellipse cx="60" cy="58" rx="34" ry="28" fill="#fefce8" stroke="#ca8a04" strokeWidth="2.5" />
            <polygon points="32,40 18,16 46,28" fill="#fef9c3" stroke="#ca8a04" strokeWidth="2.5" />
            <polygon points="88,40 102,16 74,28" fill="#fef9c3" stroke="#ca8a04" strokeWidth="2.5" />
            {/* Big Shocked Eyes with Tiny Pupils */}
            <circle cx="46" cy="50" r="9" fill="#ffffff" stroke="#a16207" strokeWidth="2" />
            <circle cx="46" cy="50" r="3" fill="#000" />
            <circle cx="74" cy="50" r="9" fill="#ffffff" stroke="#a16207" strokeWidth="2" />
            <circle cx="74" cy="50" r="3" fill="#000" />
            {/* Open round mouth */}
            <ellipse cx="60" cy="67" rx="6" ry="8" fill="#451a03" stroke="#a16207" strokeWidth="1.5" />
            {/* Sweat drop */}
            <path d="M 86 42 Q 90 48 86 52 Q 82 48 86 42 Z" fill="#38bdf8" />
            {/* Shock lines */}
            <text x="18" y="34" fontSize="16">⚡</text>
            <text x="86" y="30" fontSize="16">⁉️</text>
          </g>
        );

      case 'cat_cry':
        return (
          <g>
            <ellipse cx="60" cy="58" rx="34" ry="28" fill="#f0f9ff" stroke="#0284c7" strokeWidth="2.5" />
            <polygon points="32,44 20,24 46,34" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2.5" />
            <polygon points="88,44 100,24 74,34" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2.5" />
            {/* Tearful eyes with waterfall tears */}
            <path d="M 43 52 Q 49 46 55 52" fill="none" stroke="#0369a1" strokeWidth="3" strokeLinecap="round" />
            <path d="M 65 52 Q 71 46 77 52" fill="none" stroke="#0369a1" strokeWidth="3" strokeLinecap="round" />
            {/* Cascading tears */}
            <path d="M 44 54 C 36 68, 48 76, 44 86" fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
            <path d="M 76 54 C 84 68, 72 76, 76 86" fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" />
            {/* Quivering sad mouth */}
            <path d="M 54 65 Q 60 61 66 65" fill="none" stroke="#0369a1" strokeWidth="2.5" strokeLinecap="round" />
            <text x="50" y="34" fontSize="16">💧</text>
          </g>
        );

      case 'cat_sleepy':
        return (
          <g>
            <ellipse cx="60" cy="60" rx="34" ry="28" fill="#faf5ff" stroke="#9333ea" strokeWidth="2.5" />
            <polygon points="32,44 22,22 46,32" fill="#f3e8ff" stroke="#9333ea" strokeWidth="2.5" />
            <polygon points="88,44 98,22 74,32" fill="#f3e8ff" stroke="#9333ea" strokeWidth="2.5" />
            {/* Sleeping Nightcap */}
            <path d="M 36 34 C 40 10, 80 8, 86 34 Z" fill="#c084fc" stroke="#7e22ce" strokeWidth="2" />
            <circle cx="86" cy="18" r="5" fill="#fef08a" />
            {/* Peaceful closed eyes */}
            <path d="M 44 56 Q 50 61 56 56" fill="none" stroke="#6b21a8" strokeWidth="3" strokeLinecap="round" />
            <path d="M 64 56 Q 70 61 76 56" fill="none" stroke="#6b21a8" strokeWidth="3" strokeLinecap="round" />
            {/* Snot/Sleep bubble */}
            <circle cx="68" cy="64" r="6" fill="#67e8f9" opacity="0.8" stroke="#06b6d4" strokeWidth="1" />
            <circle cx="69" cy="62" r="2" fill="#fff" />
            {/* Zzz */}
            <text x="84" y="44" fontSize="14" fill="#a855f7" fontWeight="bold">Z</text>
            <text x="92" y="34" fontSize="11" fill="#c084fc" fontWeight="bold">z</text>
            <text x="98" y="26" fontSize="9" fill="#d8b4fe" fontWeight="bold">z</text>
          </g>
        );

      case 'cat_snack':
        return (
          <g>
            <ellipse cx="60" cy="56" rx="34" ry="28" fill="#fff7ed" stroke="#ea580c" strokeWidth="2.5" />
            <polygon points="32,40 22,18 46,30" fill="#ffedd5" stroke="#ea580c" strokeWidth="2.5" />
            <polygon points="88,40 98,18 74,30" fill="#ffedd5" stroke="#ea580c" strokeWidth="2.5" />
            {/* Happy munching eyes */}
            <path d="M 44 50 Q 50 44 56 50" fill="none" stroke="#9a3412" strokeWidth="3" strokeLinecap="round" />
            <path d="M 64 50 Q 70 44 76 50" fill="none" stroke="#9a3412" strokeWidth="3" strokeLinecap="round" />
            <circle cx="38" cy="58" r="5" fill="#fdba74" opacity="0.6" />
            <circle cx="82" cy="58" r="5" fill="#fdba74" opacity="0.6" />
            {/* Holding yummy grilled fish */}
            <g transform="translate(42, 60)">
              <ellipse cx="18" cy="14" rx="16" ry="8" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
              <polygon points="34,14 42,8 42,20" fill="#0284c7" />
              <circle cx="8" cy="13" r="2" fill="#000" />
              <line x1="16" y1="9" x2="16" y2="19" stroke="#0284c7" strokeWidth="1" />
              <line x1="22" y1="10" x2="22" y2="18" stroke="#0284c7" strokeWidth="1" />
            </g>
            <text x="52" y="32" fontSize="16">🐟</text>
          </g>
        );

      case 'cat_cool':
        return (
          <g>
            <ellipse cx="60" cy="58" rx="34" ry="28" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
            <polygon points="32,42 22,18 46,30" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2.5" />
            <polygon points="88,42 98,18 74,30" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2.5" />
            {/* Cool Sunglasses */}
            <polygon points="35,46 58,46 54,60 38,60" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
            <polygon points="62,46 85,46 82,60 66,60" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
            <line x1="56" y1="48" x2="64" y2="48" stroke="#0f172a" strokeWidth="3" />
            {/* White reflection shine on sunglasses */}
            <line x1="40" y1="49" x2="44" y2="57" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="67" y1="49" x2="71" y2="57" stroke="#94a3b8" strokeWidth="1.5" />
            {/* Smirk */}
            <path d="M 58 66 Q 66 69 72 63" fill="none" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
            <text x="78" y="32" fontSize="16">🕶️</text>
          </g>
        );

      case 'cat_pout':
        return (
          <g>
            <ellipse cx="60" cy="58" rx="34" ry="28" fill="#fdf2f8" stroke="#be123c" strokeWidth="2.5" />
            <polygon points="32,42 22,20 46,32" fill="#ffe4e6" stroke="#be123c" strokeWidth="2.5" />
            <polygon points="88,42 98,20 74,32" fill="#ffe4e6" stroke="#be123c" strokeWidth="2.5" />
            {/* Side-glancing annoyed eyes */}
            <ellipse cx="46" cy="52" rx="6" ry="7" fill="#881337" />
            <circle cx="44" cy="51" r="2" fill="#fff" />
            <ellipse cx="72" cy="52" rx="6" ry="7" fill="#881337" />
            <circle cx="70" cy="51" r="2" fill="#fff" />
            {/* Big puffy cheeks */}
            <circle cx="36" cy="62" r="7" fill="#f43f5e" opacity="0.7" />
            <circle cx="84" cy="62" r="7" fill="#f43f5e" opacity="0.7" />
            {/* Cute grumpy pout */}
            <path d="M 55 65 Q 60 61 65 65" fill="none" stroke="#881337" strokeWidth="3" strokeLinecap="round" />
            <text x="80" y="34" fontSize="16">💢</text>
          </g>
        );

      case 'cat_coffee':
        return (
          <g>
            <ellipse cx="60" cy="54" rx="34" ry="28" fill="#fffbeb" stroke="#78350f" strokeWidth="2.5" />
            <polygon points="32,38 22,16 46,28" fill="#fef3c7" stroke="#78350f" strokeWidth="2.5" />
            <polygon points="88,38 98,16 74,28" fill="#fef3c7" stroke="#78350f" strokeWidth="2.5" />
            {/* Relaxed closed eyes */}
            <path d="M 44 48 Q 50 53 56 48" fill="none" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
            <path d="M 64 48 Q 70 53 76 48" fill="none" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
            <circle cx="38" cy="54" r="5" fill="#fde68a" />
            <circle cx="82" cy="54" r="5" fill="#fde68a" />
            {/* Warm Coffee Mug with Steam */}
            <rect x="48" y="60" width="24" height="20" rx="4" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
            <path d="M 72 64 C 77 64, 77 74, 72 74" fill="none" stroke="#78350f" strokeWidth="2" />
            {/* Steam waves */}
            <path d="M 54 57 Q 56 52 54 48" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 64 57 Q 66 52 64 48" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
            <text x="78" y="28" fontSize="14">☕</text>
          </g>
        );

      case 'cat_pat':
      default:
        return (
          <g>
            <ellipse cx="60" cy="60" rx="34" ry="28" fill="#f5f3ff" stroke="#7c3aed" strokeWidth="2.5" />
            <polygon points="32,44 22,22 46,34" fill="#ede9fe" stroke="#7c3aed" strokeWidth="2.5" />
            <polygon points="88,44 98,22 74,34" fill="#ede9fe" stroke="#7c3aed" strokeWidth="2.5" />
            {/* Content blissed-out eyes */}
            <path d="M 44 56 Q 50 50 56 56" fill="none" stroke="#5b21b6" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M 64 56 Q 70 50 76 56" fill="none" stroke="#5b21b6" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="38" cy="64" r="5.5" fill="#f472b6" opacity="0.6" />
            <circle cx="82" cy="64" r="5.5" fill="#f472b6" opacity="0.6" />
            {/* Patting hand above */}
            <path d="M 48 30 Q 60 25 72 30" fill="none" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" />
            <text x="76" y="26" fontSize="14">🎵</text>
            <text x="24" y="30" fontSize="14">🌸</text>
          </g>
        );
    }
  };

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${className} ${
        animate ? 'hover:scale-105 transition-transform duration-200 cursor-pointer' : ''
      }`}
      title={sticker ? `${sticker.name} (${sticker.label})` : id}
    >
      <div 
        className="relative p-1.5 rounded-2xl bg-white/95 border-2 border-violet-200 shadow-sm flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 120 110"
          width={size - 12}
          height={size - 12}
          className="overflow-visible filter drop-shadow-sm"
        >
          {renderStickerIllustration()}
        </svg>
      </div>
      {sticker && (
        <span className="mt-1 text-[11px] font-bold text-violet-800 bg-violet-100/90 border border-violet-300/80 px-2 py-0.5 rounded-full text-center whitespace-nowrap shadow-xs">
          {sticker.name}
        </span>
      )}
    </div>
  );
};
