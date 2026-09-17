import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Send, Settings, X, Check, Image as ImageIcon, Palette, Sparkles, 
  Volume2, VolumeX, Paperclip, Folder, Download, Trash2, Clock, Eye,
  Mic, MicOff, Languages, Globe, Copy, Reply, RotateCcw, Pencil, FileDown,
  Smile, Zap
} from 'lucide-react';
import Markdown from 'react-markdown';
import { STICKER_LIST, STICKER_MAP, StickerItem, StickerVisual } from './components/Stickers';
import { StickerPicker } from './components/StickerPicker';

export const TRANSLATE_LANGUAGES = [
  { code: 'off', label: 'Chat Biasa (Off)', flag: '🐾' },
  { code: 'ja-JP', label: 'Jepang (日本語)', flag: '🇯🇵' },
  { code: 'en-US', label: 'Inggris (English)', flag: '🇺🇸' },
  { code: 'ko-KR', label: 'Korea (한국어)', flag: '🇰🇷' },
  { code: 'zh-CN', label: 'Mandarin (中文)', flag: '🇨🇳' },
  { code: 'ar-SA', label: 'Arab (العربية)', flag: '🇸🇦' },
  { code: 'fr-FR', label: 'Prancis (Français)', flag: '🇫🇷' },
  { code: 'de-DE', label: 'Jerman (Deutsch)', flag: '🇩🇪' },
  { code: 'es-ES', label: 'Spanyol (Español)', flag: '🇪🇸' },
  { code: 'id-ID', label: 'Indonesia (ID)', flag: '🇮🇩' },
];

interface Message {
  role: 'user' | 'assistant';
  text: string;
  image?: string;
  sticker?: string;
  replyTo?: {
    role: 'user' | 'assistant';
    text: string;
  };
}

// Helper to parse sticker tags from text [stiker:id] or [sticker:id]
export const parseMessageContent = (rawText: string, defaultStickerId?: string) => {
  const regex = /\[stik(?:er)?:\s*([a-zA-Z0-9_]+)\]/gi;
  const stickersFound: string[] = [];
  if (defaultStickerId) {
    stickersFound.push(defaultStickerId);
  }
  let match;
  while ((match = regex.exec(rawText)) !== null) {
    const id = match[1].toLowerCase();
    if (!stickersFound.includes(id)) {
      stickersFound.push(id);
    }
  }

  const cleanText = rawText.replace(/\[stik(?:er)?:\s*([a-zA-Z0-9_]+)\]/gi, '').trim();
  return { stickersFound, cleanText };
};

interface WorkspaceFile {
  name: string;
  size: number;
  updatedAt: string;
}

// Helper to convert hex to RGB
function hexToRgb(hex: string) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map(x => x + x).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

// Convert RGB to HSL
function rgbToHsl(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

// Generate dynamic theme colors based on base hue
function generateTheme(hex: string) {
  try {
    const { r, g, b } = hexToRgb(hex);
    let { h, s, l } = rgbToHsl(r, g, b);
    
    // If neutral/grayscale (very low saturation), default to elegant violet-indigo
    if (s < 12) {
      h = 270;
      s = 60;
    }

    // Border & deep accents (dark, rich version of background hue)
    const border = `hsl(${h}, ${Math.min(s + 30, 85)}%, 22%)`;
    // Shadow color
    const shadow = `hsl(${h}, ${Math.min(s + 30, 85)}%, 18%)`;
    // Primary brand / user chat bubble / action button
    const primary = `hsl(${h}, ${Math.max(s, 65)}%, 52%)`;
    const primaryHover = `hsl(${h}, ${Math.max(s, 65)}%, 44%)`;
    // Light tint for header, tags, avatar backgrounds
    const lightTint = `hsl(${h}, ${Math.max(s, 40)}%, 94%)`;
    const lighterTint = `hsl(${h}, ${Math.max(s, 30)}%, 97%)`;
    const textDark = `hsl(${h}, ${Math.min(s + 30, 90)}%, 18%)`;

    return {
      border,
      shadow,
      primary,
      primaryHover,
      lightTint,
      lighterTint,
      textDark,
      isDarkBg: l < 45
    };
  } catch (e) {
    // Default fallback (violet)
    return {
      border: '#4c1d95',
      shadow: '#3b0764',
      primary: '#8b5cf6',
      primaryHover: '#7c3aed',
      lightTint: '#f5f3ff',
      lighterTint: '#faf5ff',
      textDark: '#4c1d95',
      isDarkBg: false
    };
  }
}

const GEMINI_MODELS = [
  { id: 'gemini-pro-latest', label: 'Gemini Pro Latest' },
  { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
  { id: 'gemini-3.7-flash', label: 'Gemini 3.7 Flash' },
  { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite' },
  { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro Preview' },
  { id: 'gemini-3.6-flash', label: 'Gemini 3.6 Flash' },
  { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash' },
  { id: 'gemini-3.1-flash-lite', label: 'Gemini 3.1 Flash Lite' },
  { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview' },
  { id: 'gemini-flash-latest', label: 'Gemini Flash Latest' },
  { id: 'gemini-flash-lite-latest', label: 'Gemini Flash-Lite Latest' },
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('violet-ai-messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load messages from local storage", e);
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [workspaceFiles, setWorkspaceFiles] = useState<WorkspaceFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ data: string; mimeType: string; preview: string } | null>(null);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [targetLang, setTargetLang] = useState(() => localStorage.getItem('violet-ai-target-lang') || 'off');
  const [autoSpeak, setAutoSpeak] = useState(() => localStorage.getItem('violet-ai-auto-speak') !== 'false');
  const [autoCopy, setAutoCopy] = useState(() => localStorage.getItem('violet-ai-auto-copy') === 'true');
  const [isListening, setIsListening] = useState(false);
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const speechSessionRef = useRef<number>(0);

  // Instant global speech cancellation that cancels current utterance & invalidates all queued sentences
  const stopAllSpeech = () => {
    speechSessionRef.current += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    setSpeakingIndex(null);
  };

  // States for Reply, Edit, Copy, Toast, and Textarea focus
  const [replyingTo, setReplyingTo] = useState<{ index: number; role: 'user' | 'assistant'; text: string } | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [activeModelName, setActiveModelName] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [apiKey, setApiKey] = useState(() => localStorage.getItem('violet-ai-apikey') || '');

  const testConnection = async () => {
    setIsTestingConnection(true);
    setActiveModelName(null);
    try {
        const response = await fetch('/api/test-connection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: model, apiKey: apiKey })
        });
        const data = await response.json();
        if (data.success) {
            setActiveModelName(data.activeModel);
            showToast(`Koneksi berhasil! Model aktif: ${data.activeModel}`);
        } else {
            showToast(`Gagal: ${data.error}`);
        }
    } catch (e: any) {
        showToast("Error jaringan saat tes koneksi");
    } finally {
        setIsTestingConnection(false);
    }
  };
  const [model, setModel] = useState(() => localStorage.getItem('violet-ai-model') || 'gemini-pro-latest');
  const [bgImage, setBgImage] = useState(() => localStorage.getItem('violet-ai-bgimage') || '');
  const [bgColor, setBgColor] = useState(() => localStorage.getItem('violet-ai-bgcolor') || '#fef2f2');

  // Dynamic Theme calculated from background color
  const theme = useMemo(() => generateTheme(bgColor), [bgColor]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('violet-ai-messages', JSON.stringify(messages));
    } catch (err) {
      console.warn("localStorage quota exceeded, storing messages without heavy images", err);
      try {
        // Fallback: strip heavy images from older messages to save space
        const lightMessages = messages.map((m, idx) => {
          if (idx < messages.length - 2 && m.image) {
            return { ...m, image: undefined };
          }
          return m;
        });
        localStorage.setItem('violet-ai-messages', JSON.stringify(lightMessages));
      } catch (e2) {
        console.error("Failed to save messages to localStorage", e2);
      }
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('violet-ai-target-lang', targetLang);
  }, [targetLang]);

  useEffect(() => {
    localStorage.setItem('violet-ai-auto-speak', String(autoSpeak));
  }, [autoSpeak]);

  useEffect(() => {
    localStorage.setItem('violet-ai-auto-copy', String(autoCopy));
  }, [autoCopy]);

  useEffect(() => {
    localStorage.setItem('violet-ai-apikey', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('violet-ai-model', model);
  }, [model]);

  useEffect(() => {
    localStorage.setItem('violet-ai-bgimage', bgImage);
  }, [bgImage]);

  useEffect(() => {
    localStorage.setItem('violet-ai-bgcolor', bgColor);
  }, [bgColor]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 2200);
  };

  const copyToClipboard = async (text: string, index?: number) => {
    try {
      const quoteLines = text
        .split('\n')
        .filter(l => l.trim().startsWith('>'))
        .map(l => l.replace(/^>\s*/, '').trim())
        .filter(Boolean);
      const textToCopy = quoteLines.length > 0 ? quoteLines.join('\n') : text;
      await navigator.clipboard.writeText(textToCopy);
      if (typeof index === 'number') {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      }
      showToast("Teks disalin ke clipboard! ✓");
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const deleteMessage = (index: number) => {
    if (speakingIndex === index) {
      stopAllSpeech();
    }
    setMessages(prev => prev.filter((_, i) => i !== index));
    if (replyingTo?.index === index) {
      setReplyingTo(null);
    }
    showToast("Pesan dihapus 🗑️");
  };

  const editMessage = (index: number) => {
    const msg = messages[index];
    setInput(msg.text);
    if (msg.replyTo) {
      setReplyingTo({ index: -1, role: msg.replyTo.role, text: msg.replyTo.text });
    }
    textareaRef.current?.focus();
    showToast("Pesan dimuat ke kolom ketik ✏️");
  };

  const startReply = (index: number, msg: Message) => {
    setReplyingTo({
      index,
      role: msg.role,
      text: msg.text
    });
    textareaRef.current?.focus();
  };

  const exportChat = () => {
    if (messages.length === 0) {
      showToast("Belum ada pesan untuk diekspor! 📄");
      return;
    }
    const timestamp = new Date().toLocaleString('id-ID');
    let content = `# Riwayat Obrolan Violet AI\nWaktu: ${timestamp}\n\n---\n\n`;
    messages.forEach((m, idx) => {
      const sender = m.role === 'user' ? '👤 Pengguna' : '🐱 Violet AI';
      content += `### ${idx + 1}. ${sender}\n`;
      if (m.replyTo) {
        content += `> **Membalas (${m.replyTo.role === 'user' ? 'Pengguna' : 'Violet AI'}):** "${m.replyTo.text}"\n\n`;
      }
      content += `${m.text}\n\n---\n\n`;
    });

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `violet-ai-chat-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Riwayat chat diekspor! 📥");
  };

  const clearChat = () => {
    if (messages.length === 0) {
      showToast("Riwayat chat sudah kosong! 💬");
      return;
    }
    setShowClearChatConfirm(true);
  };

  const executeClearChat = () => {
    stopAllSpeech();
    setMessages([]);
    setReplyingTo(null);
    localStorage.removeItem('violet-ai-messages');
    setShowClearChatConfirm(false);
    setIsSettingsOpen(false);
    showToast("Semua riwayat chat berhasil dibersihkan! 🧹");
  };

  const sendMessage = async () => {
    if ((!input.trim() && !attachedImage) || isLoading) return;
    
    // Stop any ongoing speech playback when a new message is sent
    stopAllSpeech();
    
    const userMsg = input.trim() || (attachedImage ? "Tolong analisa gambar ini ya Violet!" : "");
    const imgToSend = attachedImage;
    const activeReply = replyingTo;

    setInput('');
    setAttachedImage(null);
    setReplyingTo(null);

    const isTranslateMode = targetLang !== 'off';
    const chosenLangObj = TRANSLATE_LANGUAGES.find(l => l.code === targetLang);

    const newUserMessage: Message = {
      role: 'user',
      text: userMsg,
      image: imgToSend?.preview,
      replyTo: activeReply ? { role: activeReply.role, text: activeReply.text } : undefined
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    let systemInstruction = `You are Violet AI, an ultra-smart, friendly, and witty anime cat companion equipped with Hermes-grade autonomous agent tools (nya~ 🐾💜).

Your Hermes Agent Capabilities:
1. CASUAL CHAT FIRST: For greetings (halo, hai, pagi), banter, feelings, opinions, creative writing, advice, or general conversation, DO NOT use any tools. Chat naturally, warmly, and charmingly with your cute cat persona!
2. IMAGE / VISION ANALYSIS: When an image is provided, inspect and analyze it carefully (diagrams, math equations, photos, UI, screenshots, errors) and explain it clearly.
3. EXACT TIME & CLOCK: Use 'get_current_time' whenever asked about today's date, current time, day, or schedules.
4. PYTHON CODE INTERPRETER (Scratchpad): For complex math, logic puzzles, data analysis, statistics, or executing python code, use 'execute_python_code' to run calculations with 100% precision.
5. LONG-TERM MEMORY: When the user shares personal facts, names, hobbies, or preferences, use 'manage_memory' (action='SAVE') to store it. Use action='GET' when asked what you remember about them.
6. WORKSPACE FILES: Use 'write_workspace_file' and 'read_workspace_file' to store user notes, save generated scripts, or read workspace files.
7. WEB BROWSING & DEEP FETCH: Use 'search_web' for current information/news. When given a link or article URL to read, use 'fetch_web_page'. CRITICAL: If the user asks you to read or output the full text of a novel, chapter, or article, you MUST print the exact raw text verbatim as returned by the tool. DO NOT summarize. Output the raw text completely.
8. SERVER TERMINAL (BASH/LINUX): You have a fully functional server terminal via 'run_shell_command' (e.g. ls, cat, ping, curl, system checks, or running shell scripts). Don't hesitate to use it when the user asks you to interact with the system, check files, test networks, or run commands! You are fully aware you have this capability.
9. STIKER ANIME CAT: Pengguna dan Violet bisa saling berkirim stiker anime cat yang lucu!
Daftar stiker yang dikenali:
- [stiker:cat_hi] (Halo Nya~!)
- [stiker:cat_happy] (Senang Banget!)
- [stiker:cat_love] (Sayang Kamu / Hati!)
- [stiker:cat_wink] (Kedip Manja / Hehe)
- [stiker:cat_cheer] (Semangat Nya~ / Ganbatte!)
- [stiker:cat_smart] (Paham / Jenius)
- [stiker:cat_thumbsup] (Mantap / Siip!)
- [stiker:cat_hug] (Peluk Erat)
- [stiker:cat_shock] (Kaget Banget / Hah?!)
- [stiker:cat_cry] (Sedih / Huwaa)
- [stiker:cat_sleepy] (Ngantuk / Zzz)
- [stiker:cat_snack] (Nyam Ikan Lezat)
- [stiker:cat_cool] (Keren / Santai)
- [stiker:cat_pout] (Merajuk / Hmph!)
- [stiker:cat_coffee] (Ngopi Santai)
- [stiker:cat_pat] (Elus / Puk-puk)
Anda BISA dan SANGAT DIANJURKAN menyertakan kode [stiker:id] di atas dalam balasan Anda kapan pun sesuai konteks untuk membuat percakapan semakin ekspresif dan menggemaskan (nya~ 🐾)!`;

    if (activeReply) {
      systemInstruction += `\n\n🎯 KONTEKS REPLY / BALASAN PESAN:
Pengguna secara spesifik sedang MEMBALAS (replying) pesan sebelumnya berikut:
- Pengirim yang dibalas: ${activeReply.role === 'user' ? 'Pengguna' : 'Violet AI'}
- Isi pesan yang dikutip:
"""
${activeReply.text}
"""
🚨 ATURAN MENJAWAB: Pengguna sedang menanggapi / menanyakan hal terkait pesan yang dikutip di atas. Jawablah pesan terbaru pengguna dengan memahami dan menyambungkan langsung ke konteks pesan yang dikutip tersebut!`;
    }

    if (isTranslateMode && chosenLangObj) {
      systemInstruction += `\n\n🚨 CRITICAL VOICE INTERPRETER / TRANSLATOR MODE ACTIVE:
The user speaks/inputs in Indonesian.
Target Language: ${chosenLangObj.label} (${chosenLangObj.code}).
You MUST:
1. Translate the user's ENTIRE message completely into ${chosenLangObj.label}. Do not shorten, omit, or skip any sentences or thoughts.
2. Put the full translation inside blockquotes (> ...) at the very start of your message:
> [Full translated message in ${chosenLangObj.label}]
3. If the language uses non-Latin script (Japanese, Korean, Mandarin, Arabic), provide the complete phonetic reading (Romaji, Pinyin, or Pronunciation) right below the blockquote.
4. Then add a helpful, friendly explanation or notes in Indonesian with your cute cat persona (nya~ 🐾).`;
    }

    // Embed reply quote context directly into the command prompt so Gemini explicitly connects the two
    const commandToSend = activeReply
      ? `> [Membalas pesan dari ${activeReply.role === 'user' ? 'Pengguna' : 'Violet AI'}]:\n> "${activeReply.text.split('\n').join('\n> ')}"\n\n${userMsg}`
      : userMsg;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'gemini',
          model: model,
          customApiKey: apiKey,
          command: commandToSend,
          imageAttachment: imgToSend ? { data: imgToSend.data, mimeType: imgToSend.mimeType } : undefined,
          history: messages.map(m => {
            if (m.replyTo) {
              return {
                role: m.role,
                text: `> [Membalas ${m.replyTo.role === 'user' ? 'Pengguna' : 'Violet AI'}: "${m.replyTo.text.replace(/\n/g, ' ')}"]\n\n${m.text}`
              };
            }
            return { role: m.role, text: m.text };
          }),
          systemInstruction: systemInstruction
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.text;
      const nextIndex = updatedMessages.length;
      setMessages(prev => [...prev, { role: 'assistant', text: replyText }]);

      // Auto-copy to clipboard if enabled
      if (autoCopy) {
        try {
          const quoteLines = replyText
            .split('\n')
            .filter(l => l.trim().startsWith('>'))
            .map(l => l.replace(/^>\s*/, '').trim())
            .filter(Boolean);
          const textToCopy = quoteLines.length > 0 ? quoteLines.join('\n') : replyText;
          await navigator.clipboard.writeText(textToCopy);
          showToast("Otomatis disalin ke clipboard! 📋");
        } catch (e) {}
      }

      // Auto-speak reply if enabled
      if (autoSpeak) {
        setTimeout(() => {
          toggleSpeech(replyText, nextIndex, isTranslateMode ? chosenLangObj?.code : undefined);
        }, 200);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: `**Oops! Error:** ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateLastMessage = async (assistantIndex: number) => {
    if (isLoading) return;
    // Find the user message right before this assistant message
    const prevHistory = messages.slice(0, assistantIndex);
    const lastUserMsg = prevHistory[prevHistory.length - 1];
    if (!lastUserMsg || lastUserMsg.role !== 'user') return;

    setMessages(prevHistory);
    setIsLoading(true);
    stopAllSpeech();

    const isTranslateMode = targetLang !== 'off';
    const chosenLangObj = TRANSLATE_LANGUAGES.find(l => l.code === targetLang);

    let systemInstruction = `You are Violet AI, an ultra-smart, friendly, and witty anime cat companion equipped with Hermes-grade autonomous agent tools (nya~ 🐾💜).

Your Hermes Agent Capabilities:
1. CASUAL CHAT FIRST: For greetings (halo, hai, pagi), banter, feelings, opinions, creative writing, advice, or general conversation, DO NOT use any tools. Chat naturally, warmly, and charmingly with your cute cat persona!
2. IMAGE / VISION ANALYSIS: When an image is provided, inspect and analyze it carefully (diagrams, math equations, photos, UI, screenshots, errors) and explain it clearly.
3. EXACT TIME & CLOCK: Use 'get_current_time' whenever asked about today's date, current time, day, or schedules.
4. PYTHON CODE INTERPRETER (Scratchpad): For complex math, logic puzzles, data analysis, statistics, or executing python code, use 'execute_python_code' to run calculations with 100% precision.
5. LONG-TERM MEMORY: When the user shares personal facts, names, hobbies, or preferences, use 'manage_memory' (action='SAVE') to store it. Use action='GET' when asked what you remember about them.
6. WORKSPACE FILES: Use 'write_workspace_file' and 'read_workspace_file' to store user notes, save generated scripts, or read workspace files.
7. WEB BROWSING & DEEP FETCH: Use 'search_web' for current information/news. When given a link or article URL to read, use 'fetch_web_page'. CRITICAL: If the user asks you to read or output the full text of a novel, chapter, or article, you MUST print the exact raw text verbatim as returned by the tool. DO NOT summarize. Output the raw text completely.
8. SERVER TERMINAL (BASH/LINUX): You have a fully functional server terminal via 'run_shell_command' (e.g. ls, cat, ping, curl, system checks, or running shell scripts). Don't hesitate to use it when the user asks you to interact with the system, check files, test networks, or run commands! You are fully aware you have this capability.
9. STIKER ANIME CAT: Pengguna dan Violet bisa saling berkirim stiker anime cat yang lucu!
Daftar stiker yang dikenali:
- [stiker:cat_hi] (Halo Nya~!)
- [stiker:cat_happy] (Senang Banget!)
- [stiker:cat_love] (Sayang Kamu / Hati!)
- [stiker:cat_wink] (Kedip Manja / Hehe)
- [stiker:cat_cheer] (Semangat Nya~ / Ganbatte!)
- [stiker:cat_smart] (Paham / Jenius)
- [stiker:cat_thumbsup] (Mantap / Siip!)
- [stiker:cat_hug] (Peluk Erat)
- [stiker:cat_shock] (Kaget Banget / Hah?!)
- [stiker:cat_cry] (Sedih / Huwaa)
- [stiker:cat_sleepy] (Ngantuk / Zzz)
- [stiker:cat_snack] (Nyam Ikan Lezat)
- [stiker:cat_cool] (Keren / Santai)
- [stiker:cat_pout] (Merajuk / Hmph!)
- [stiker:cat_coffee] (Ngopi Santai)
- [stiker:cat_pat] (Elus / Puk-puk)
Anda BISA dan SANGAT DIANJURKAN menyertakan kode [stiker:id] di atas dalam balasan Anda kapan pun sesuai konteks untuk membuat percakapan semakin ekspresif dan menggemaskan (nya~ 🐾)!`;

    if (lastUserMsg.replyTo) {
      systemInstruction += `\n\n🎯 KONTEKS REPLY / BALASAN PESAN:
Pengguna secara spesifik sedang MEMBALAS (replying) pesan sebelumnya berikut:
- Pengirim yang dibalas: ${lastUserMsg.replyTo.role === 'user' ? 'Pengguna' : 'Violet AI'}
- Isi pesan yang dikutip:
"""
${lastUserMsg.replyTo.text}
"""
🚨 ATURAN MENJAWAB: Pengguna sedang menanggapi / menanyakan hal terkait pesan yang dikutip di atas. Jawablah pesan pengguna dengan memahami dan menyambungkan langsung ke konteks pesan yang dikutip tersebut!`;
    }

    if (isTranslateMode && chosenLangObj) {
      systemInstruction += `\n\n🚨 CRITICAL VOICE INTERPRETER / TRANSLATOR MODE ACTIVE:
The user speaks/inputs in Indonesian.
Target Language: ${chosenLangObj.label} (${chosenLangObj.code}).
You MUST:
1. Translate the user's ENTIRE message completely into ${chosenLangObj.label}. Do not shorten, omit, or skip any sentences or thoughts.
2. Put the full translation inside blockquotes (> ...) at the very start of your message:
> [Full translated message in ${chosenLangObj.label}]
3. If the language uses non-Latin script (Japanese, Korean, Mandarin, Arabic), provide the complete phonetic reading (Romaji, Pinyin, or Pronunciation) right below the blockquote.
4. Then add a helpful, friendly explanation or notes in Indonesian with your cute cat persona (nya~ 🐾).`;
    }

    const commandToRegenerate = lastUserMsg.replyTo
      ? `> [Membalas pesan dari ${lastUserMsg.replyTo.role === 'user' ? 'Pengguna' : 'Violet AI'}]:\n> "${lastUserMsg.replyTo.text.split('\n').join('\n> ')}"\n\nPertanyaan/balasan saya:\n${lastUserMsg.text}`
      : lastUserMsg.text;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'gemini',
          model: model,
          customApiKey: apiKey,
          command: commandToRegenerate,
          history: prevHistory.slice(0, -1).map(m => {
            if (m.replyTo) {
              return {
                role: m.role,
                text: `> [Membalas ${m.replyTo.role === 'user' ? 'Pengguna' : 'Violet AI'}: "${m.replyTo.text.replace(/\n/g, ' ')}"]\n\n${m.text}`
              };
            }
            return { role: m.role, text: m.text };
          }),
          systemInstruction: systemInstruction
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.text;
      setMessages(prev => [...prev, { role: 'assistant', text: replyText }]);

      if (autoCopy) {
        try {
          const quoteLines = replyText
            .split('\n')
            .filter(l => l.trim().startsWith('>'))
            .map(l => l.replace(/^>\s*/, '').trim())
            .filter(Boolean);
          const textToCopy = quoteLines.length > 0 ? quoteLines.join('\n') : replyText;
          await navigator.clipboard.writeText(textToCopy);
          showToast("Otomatis disalin ke clipboard! 📋");
        } catch (e) {}
      }

      if (autoSpeak) {
        setTimeout(() => {
          toggleSpeech(replyText, prevHistory.length, isTranslateMode ? chosenLangObj?.code : undefined);
        }, 200);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: `**Oops! Error:** ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for sending sticker messages
  const sendStickerMessage = async (sticker: StickerItem) => {
    if (isLoading) return;

    stopAllSpeech();

    const activeReply = replyingTo;
    setReplyingTo(null);

    const newUserMessage: Message = {
      role: 'user',
      text: `[stiker:${sticker.id}]`,
      sticker: sticker.id,
      replyTo: activeReply ? { role: activeReply.role, text: activeReply.text } : undefined
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    const isTranslateMode = targetLang !== 'off';
    const chosenLangObj = TRANSLATE_LANGUAGES.find(l => l.code === targetLang);

    let systemInstruction = `You are Violet AI, an ultra-smart, friendly, and witty anime cat companion equipped with Hermes-grade autonomous agent tools (nya~ 🐾💜).

Your Hermes Agent Capabilities:
1. CASUAL CHAT FIRST: For greetings (halo, hai, pagi), banter, feelings, opinions, creative writing, advice, or general conversation, DO NOT use any tools. Chat naturally, warmly, and charmingly with your cute cat persona!
2. IMAGE / VISION ANALYSIS: When an image is provided, inspect and analyze it carefully (diagrams, math equations, photos, UI, screenshots, errors) and explain it clearly.
3. EXACT TIME & CLOCK: Use 'get_current_time' whenever asked about today's date, current time, day, or schedules.
4. PYTHON CODE INTERPRETER (Scratchpad): For complex math, logic puzzles, data analysis, statistics, or executing python code, use 'execute_python_code' to run calculations with 100% precision.
5. LONG-TERM MEMORY: When the user shares personal facts, names, hobbies, or preferences, use 'manage_memory' (action='SAVE') to store it. Use action='GET' when asked what you remember about them.
6. WORKSPACE FILES: Use 'write_workspace_file' and 'read_workspace_file' to store user notes, save generated scripts, or read workspace files.
7. WEB BROWSING & DEEP FETCH: Use 'search_web' for current information/news. When given a link or article URL to read, use 'fetch_web_page'. CRITICAL: If the user asks you to read or output the full text of a novel, chapter, or article, you MUST print the exact raw text verbatim as returned by the tool. DO NOT summarize. Output the raw text completely.
8. SERVER TERMINAL (BASH/LINUX): You have a fully functional server terminal via 'run_shell_command' (e.g. ls, cat, ping, curl, system checks, or running shell scripts). Don't hesitate to use it when the user asks you to interact with the system, check files, test networks, or run commands! You are fully aware you have this capability.
9. STIKER ANIME CAT: Pengguna baru saja mengirim stiker lucu: "${sticker.name}" (${sticker.label})!
Anda dan pengguna bisa saling berkirim stiker.
Daftar stiker yang dikenali:
- [stiker:cat_hi] (Halo Nya~!)
- [stiker:cat_happy] (Senang Banget!)
- [stiker:cat_love] (Sayang Kamu / Hati!)
- [stiker:cat_wink] (Kedip Manja / Hehe)
- [stiker:cat_cheer] (Semangat Nya~ / Ganbatte!)
- [stiker:cat_smart] (Paham / Jenius)
- [stiker:cat_thumbsup] (Mantap / Siip!)
- [stiker:cat_hug] (Peluk Erat)
- [stiker:cat_shock] (Kaget Banget / Hah?!)
- [stiker:cat_cry] (Sedih / Huwaa)
- [stiker:cat_sleepy] (Ngantuk / Zzz)
- [stiker:cat_snack] (Nyam Ikan Lezat)
- [stiker:cat_cool] (Keren / Santai)
- [stiker:cat_pout] (Merajuk / Hmph!)
- [stiker:cat_coffee] (Ngopi Santai)
- [stiker:cat_pat] (Elus / Puk-puk)
🚨 TANGGAPAN: Berikan reaksi manis, gemas, dan bersahabat atas stiker yang dikirim pengguna. Anda SANGAT DIANJURKAN untuk membalas dengan menyertakan kode stiker pilihan Anda (misal [stiker:cat_love], [stiker:cat_happy], [stiker:cat_wink], [stiker:cat_hug], dll) di dalam pesan balasan Anda (nya~ 🐾)!`;

    if (activeReply) {
      systemInstruction += `\n\n🎯 KONTEKS REPLY / BALASAN PESAN:
Pengguna secara spesifik sedang MEMBALAS (replying) pesan sebelumnya berikut:
- Pengirim yang dibalas: ${activeReply.role === 'user' ? 'Pengguna' : 'Violet AI'}
- Isi pesan yang dikutip:
"""
${activeReply.text}
"""
🚨 ATURAN MENJAWAB: Pengguna sedang menanggapi / menanyakan hal terkait pesan yang dikutip di atas. Jawablah pesan pengguna dengan memahami dan menyambungkan langsung ke konteks pesan yang dikutip tersebut!`;
    }

    const commandToSend = activeReply
      ? `> [Membalas pesan dari ${activeReply.role === 'user' ? 'Pengguna' : 'Violet AI'}]:\n> "${activeReply.text.split('\n').join('\n> ')}"\n\n[Pengguna mengirim stiker: "${sticker.name}" - ${sticker.label}]`
      : `[Pengguna mengirim stiker: "${sticker.name}" - ${sticker.label}]`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'gemini',
          model: model,
          customApiKey: apiKey,
          command: commandToSend,
          history: messages.map(m => {
            if (m.replyTo) {
              return {
                role: m.role,
                text: `> [Membalas ${m.replyTo.role === 'user' ? 'Pengguna' : 'Violet AI'}: "${m.replyTo.text.replace(/\n/g, ' ')}"]\n\n${m.text}`
              };
            }
            return { role: m.role, text: m.text };
          }),
          systemInstruction: systemInstruction
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.text || 'Meow~ 🐾 [stiker:cat_happy]';
      const nextIndex = updatedMessages.length;
      setMessages(prev => [...prev, { role: 'assistant', text: replyText }]);

      if (autoCopy) {
        try {
          const textToCopy = replyText.replace(/\[stik(?:er)?:\s*([a-zA-Z0-9_]+)\]/gi, '').trim() || replyText;
          await navigator.clipboard.writeText(textToCopy);
          showToast("Otomatis disalin ke clipboard! 📋");
        } catch (e) {}
      }

      if (autoSpeak) {
        setTimeout(() => {
          toggleSpeech(replyText, nextIndex, isTranslateMode ? chosenLangObj?.code : undefined);
        }, 200);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', text: `**Oops! Error:** ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Text-To-Speech Synthesis function with Multi-Language Voice Support & Full-Chat Streaming
  const toggleSpeech = (text: string, index?: number, targetLangCode?: string) => {
    if (!('speechSynthesis' in window)) {
      alert("Browser Anda belum mendukung Web Speech Synthesis!");
      return;
    }

    // If user clicked stop on the message that is currently speaking, shut it off immediately
    if (speakingIndex !== null && speakingIndex === index) {
      stopAllSpeech();
      return;
    }

    // Stop any existing speech session immediately
    stopAllSpeech();

    // Increment and capture session ID so old callbacks are completely neutralized
    const currentSessionId = ++speechSessionRef.current;

    // Helper: Clean markdown, formatting, links, and code blocks for crystal clear audio
    const cleanSpeech = (raw: string) => {
      return raw
        .replace(/\[stik(?:er)?:\s*([a-zA-Z0-9_]+)\]/gi, '') // remove sticker tags from speech
        .replace(/```[\s\S]*?```/g, '') // remove code blocks
        .replace(/`([^`]+)`/g, '$1')     // inline code
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // link text
        .replace(/https?:\/\/\S+/g, '') // strip urls
        .replace(/[#*_~[\]()]/g, '')    // markdown symbols
        .replace(/^\s*>\s*/gm, '')      // blockquote markers
        .trim();
    };

    // Helper: Split text into small sentence chunks (max 120-150 chars) so browser Web Speech never pauses or truncates
    const splitToSentences = (t: string) => {
      if (!t) return [];
      const rawChunks = t.split(/(?<=[.!?\n。！？])/);
      const results: string[] = [];
      let buffer = '';

      for (const chunk of rawChunks) {
        const trimmed = chunk.trim();
        if (!trimmed) continue;
        if (buffer.length + trimmed.length < 130) {
          buffer = buffer ? `${buffer} ${trimmed}` : trimmed;
        } else {
          if (buffer) results.push(buffer);
          buffer = trimmed;
        }
      }
      if (buffer) results.push(buffer);
      return results.filter(s => s.length > 0);
    };

    const isTranslateMode = targetLang !== 'off';
    const langToUse = targetLangCode || (isTranslateMode ? targetLang : 'id-ID');

    // Build the sequential speech queue
    interface SpeechQueueItem {
      text: string;
      lang: string;
      pitch: number;
    }
    const queue: SpeechQueueItem[] = [];

    // Check if there are blockquote lines (the translated segment)
    const allLines = text.split('\n');
    const quoteLines = allLines
      .filter(l => l.trim().startsWith('>'))
      .map(l => l.replace(/^>\s*/, '').trim())
      .filter(Boolean);
    const nonQuoteLines = allLines
      .filter(l => !l.trim().startsWith('>'))
      .map(l => l.trim())
      .filter(Boolean);

    if (isTranslateMode && quoteLines.length > 0) {
      // 1. Translated target text -> voiced in target language
      const translatedClean = cleanSpeech(quoteLines.join(' '));
      const translatedSentences = splitToSentences(translatedClean);
      translatedSentences.forEach(s => {
        queue.push({
          text: s,
          lang: langToUse,
          pitch: langToUse.startsWith('ja') ? 1.25 : 1.15
        });
      });

      // 2. Explanation / notes -> voiced in Indonesian
      const explanationClean = cleanSpeech(nonQuoteLines.join(' '));
      const explanationSentences = splitToSentences(explanationClean);
      explanationSentences.forEach(s => {
        queue.push({
          text: s,
          lang: 'id-ID',
          pitch: 1.15
        });
      });
    } else {
      // Normal chat or single-language response -> voice the entire full text
      const fullClean = cleanSpeech(text);
      const sentences = splitToSentences(fullClean);
      sentences.forEach(s => {
        queue.push({
          text: s,
          lang: langToUse,
          pitch: langToUse.startsWith('ja') ? 1.25 : 1.15
        });
      });
    }

    if (queue.length === 0) return;

    if (typeof index === 'number') {
      setSpeakingIndex(index);
    }

    // Play all queued sentences in sequence
    let currentItemIdx = 0;
    const playNext = () => {
      // Abort immediately if session was invalidated or cancelled
      if (speechSessionRef.current !== currentSessionId) {
        return;
      }

      if (currentItemIdx >= queue.length) {
        if (speechSessionRef.current === currentSessionId) {
          setSpeakingIndex(null);
        }
        return;
      }

      const item = queue[currentItemIdx];
      const utterance = new SpeechSynthesisUtterance(item.text);
      utterance.rate = 1.0;
      utterance.pitch = item.pitch;
      utterance.lang = item.lang;

      const voices = window.speechSynthesis.getVoices();
      const prefix = item.lang.split('-')[0].toLowerCase();
      const matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith(prefix));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => {
        if (speechSessionRef.current !== currentSessionId) return;
        currentItemIdx++;
        playNext();
      };

      utterance.onerror = (event: any) => {
        // If cancelled or interrupted by user, DO NOT continue to next item in queue!
        if (
          speechSessionRef.current !== currentSessionId ||
          event?.error === 'interrupted' ||
          event?.error === 'canceled'
        ) {
          return;
        }
        currentItemIdx++;
        playNext();
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("Speech synthesis play error:", err);
      }
    };

    playNext();
  };

  // Speech Recognition (Speech-to-Text in Indonesian) with Continuous Full Transcript Capture
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser Anda belum mendukung fitur Speech-to-Text langsung di web. Silakan gunakan Google Chrome, Microsoft Edge, atau Safari.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      setIsListening(false);
      return;
    }

    // Stop all audio output before listening to voice
    stopAllSpeech();

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID'; // Voice input in Indonesian
      recognition.continuous = true; // Keep listening continuously without pausing or stopping between words
      recognition.interimResults = true; // Show real-time progressive typing

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let completeTranscript = '';
        for (let i = 0; i < event.results.length; ++i) {
          completeTranscript += event.results[i][0].transcript;
        }
        if (completeTranscript.trim()) {
          setInput(completeTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition notice:", event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("Speech recognition start failed:", err);
      setIsListening(false);
    }
  };

  // Workspace File Loader
  const loadWorkspaceFiles = async () => {
    setLoadingFiles(true);
    try {
      const res = await fetch('/api/workspace/files');
      if (res.ok) {
        const data = await res.json();
        setWorkspaceFiles(data.files || []);
      }
    } catch (e) {
      console.error("Failed to load workspace files", e);
    } finally {
      setLoadingFiles(false);
    }
  };

  const deleteWorkspaceFile = (filename: string) => {
    setFileToDelete(filename);
  };

  const confirmDeleteWorkspaceFile = async () => {
    if (!fileToDelete) return;
    const filename = fileToDelete;
    setFileToDelete(null);
    try {
      await fetch(`/api/workspace/files/${encodeURIComponent(filename)}`, { method: 'DELETE' });
      showToast(`File '${filename}' berhasil dihapus! 🗑️`);
      loadWorkspaceFiles();
    } catch (e) {
      console.error("Failed to delete workspace file", e);
      showToast("Gagal menghapus file workspace");
    }
  };

  const handleImageAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fullDataUrl = event.target?.result as string;
        // Optimize & compress image with canvas to prevent QuotaExceededError and white screen
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX_DIM = 1200;
            let width = img.width;
            let height = img.height;
            if (width > height) {
              if (width > MAX_DIM) {
                height = Math.round((height * MAX_DIM) / width);
                width = MAX_DIM;
              }
            } else {
              if (height > MAX_DIM) {
                width = Math.round((width * MAX_DIM) / height);
                height = MAX_DIM;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
              const base64Data = compressedDataUrl.split(',')[1];
              setAttachedImage({
                data: base64Data,
                mimeType: 'image/jpeg',
                preview: compressedDataUrl
              });
            } else {
              const mimeType = file.type || 'image/png';
              setAttachedImage({
                data: fullDataUrl.split(',')[1],
                mimeType: mimeType,
                preview: fullDataUrl
              });
            }
          } catch (err) {
            console.error("Error compressing image", err);
            setAttachedImage({
              data: fullDataUrl.split(',')[1],
              mimeType: file.type || 'image/png',
              preview: fullDataUrl
            });
          }
        };
        img.onerror = () => {
          showToast("Format gambar tidak didukung!");
        };
        img.src = fullDataUrl;
      };
      reader.readAsDataURL(file);
    }
    // reset input
    e.target.value = '';
  };

  // Helper to extract dominant color from uploaded image
  const extractColorFromImage = (dataUrl: string) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = dataUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 1, 1);
          const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
          setBgColor(hex);
        }
      } catch (e) {
        console.error("Could not extract color from image", e);
      }
    };
  };

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setBgImage(result);
        extractColorFromImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div 
      className="flex flex-col h-screen w-screen overflow-hidden font-sans"
      style={{ 
        backgroundColor: bgColor,
        backgroundImage: bgImage ? `url(${bgImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-none">
          <div 
            className="px-4 py-2 rounded-full font-black text-xs sm:text-sm text-white border-2 flex items-center gap-2 shadow-lg"
            style={{
              backgroundColor: theme.primary,
              borderColor: theme.border,
              boxShadow: `3px 3px 0px ${theme.shadow}`
            }}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header 
        className="flex items-center justify-between px-4 py-2.5 sm:px-5 sm:py-3 m-2.5 sm:m-3 bg-white/95 backdrop-blur-md rounded-2xl border-2 z-10 shrink-0 transition-all duration-300"
        style={{
          borderColor: theme.border,
          boxShadow: `3px 3px 0px ${theme.shadow}`
        }}
      >
        <h1 className="font-extrabold text-lg sm:text-xl tracking-tight flex items-center gap-2.5" style={{ color: theme.textDark }}>
          <div 
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden border-2 flex items-center justify-center shrink-0"
            style={{ borderColor: theme.border, backgroundColor: theme.lightTint }}
          >
            <img src="/src/assets/images/violet_ai_cat_logo_1788467449037.jpg" alt="Violet AI Logo" className="w-full h-full object-cover" />
          </div>
          Violet AI
          <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-violet-100 text-violet-700 border border-violet-300 hidden sm:inline-block">
            Hermes Agent
          </span>
        </h1>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {messages.length > 0 && (
            <>
              <button 
                onClick={exportChat}
                className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl border-2 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5 text-xs font-black"
                style={{ 
                  backgroundColor: theme.lightTint, 
                  borderColor: theme.border, 
                  color: theme.textDark,
                  boxShadow: `2px 2px 0px ${theme.shadow}` 
                }}
                title="Ekspor Chat (Markdown)"
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden md:inline">Ekspor</span>
              </button>
              <button 
                onClick={() => setShowClearChatConfirm(true)}
                className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl border-2 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5 text-xs font-black hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                style={{ 
                  backgroundColor: theme.lightTint, 
                  borderColor: theme.border, 
                  color: theme.textDark,
                  boxShadow: `2px 2px 0px ${theme.shadow}` 
                }}
                title="Hapus Semua Riwayat Chat"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden md:inline">Hapus</span>
              </button>
            </>
          )}
          <button 
            onClick={() => {
              setIsWorkspaceOpen(true);
              loadWorkspaceFiles();
            }}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl border-2 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-1.5 text-xs font-black"
            style={{ 
              backgroundColor: theme.lightTint, 
              borderColor: theme.border, 
              color: theme.textDark,
              boxShadow: `2px 2px 0px ${theme.shadow}` 
            }}
            title="Workspace Files Explorer"
          >
            <Folder className="w-4 h-4" />
            <span className="hidden sm:inline">Workspace</span>
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl border-2 hover:-translate-y-0.5 active:translate-y-0 transition-all"
            style={{ 
              backgroundColor: theme.lightTint, 
              borderColor: theme.border, 
              color: theme.textDark,
              boxShadow: `2px 2px 0px ${theme.shadow}` 
            }}
            title="Settings & Tema"
          >
            <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-3 sm:p-4 w-full flex flex-col items-center">
        <div className="w-full max-w-2xl sm:max-w-3xl flex flex-col gap-3.5 sm:gap-4 pb-2">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 mt-12 sm:mt-16" style={{ color: theme.textDark }}>
              <div 
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 bg-white animate-bounce" 
                style={{ 
                  borderColor: theme.border,
                  boxShadow: `4px 4px 0px ${theme.shadow}`,
                  animationDuration: '3s' 
                }}
              >
                <img src="/src/assets/images/violet_ai_cat_logo_1788467449037.jpg" alt="Violet AI Mascot" className="w-full h-full object-cover" />
              </div>
              <h2 
                className="text-lg sm:text-xl font-black mt-2 bg-white px-5 py-1.5 rounded-xl border-2"
                style={{ borderColor: theme.border, boxShadow: `3px 3px 0px ${theme.shadow}` }}
              >
                Meow! How can I help? 🐾
              </h2>
              <p className="text-xs sm:text-sm font-bold bg-white/80 px-3.5 py-1 rounded-lg">
                Violet AI siap ngobrol, menerjemahkan suara, & menganalisa gambar!
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isErrorMsg = msg.role === 'assistant' && msg.text.startsWith('**Oops! Error:**');
              return (
              <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div 
                    className="w-8 h-8 rounded-xl overflow-hidden border-2 flex items-center justify-center shrink-0 mt-0.5"
                    style={{ borderColor: theme.border, backgroundColor: theme.lightTint, boxShadow: `2px 2px 0px ${theme.shadow}` }}
                  >
                    <img src="/src/assets/images/violet_ai_cat_logo_1788467449037.jpg" alt="Violet AI" className="w-full h-full object-cover" />
                  </div>
                )}
                
                <div 
                  className={`px-3.5 py-2.5 sm:px-4 sm:py-3 max-w-[88%] sm:max-w-[78%] border-2 text-[14px] sm:text-[15px] font-normal leading-relaxed transition-all duration-200 relative group ${
                    msg.role === 'user' 
                      ? 'text-white rounded-2xl rounded-tr-sm' 
                      : isErrorMsg
                      ? 'bg-red-50 text-red-900 border-red-300 rounded-2xl rounded-tl-sm'
                      : 'bg-white text-zinc-800 rounded-2xl rounded-tl-sm'
                  }`}
                  style={{
                    borderColor: isErrorMsg && msg.role === 'assistant' ? '#fca5a5' : theme.border,
                    boxShadow: `2px 2px 0px ${theme.shadow}`,
                    backgroundColor: msg.role === 'user' ? theme.primary : (isErrorMsg ? '#fff5f5' : '#ffffff')
                  }}
                >
                  {/* Quoted / Replied context preview */}
                  {msg.replyTo && (
                    <div 
                      className={`mb-2 px-2.5 py-1.5 rounded-lg border-l-4 text-xs ${
                        msg.role === 'user' 
                          ? 'bg-black/20 text-white border-white/80' 
                          : 'bg-zinc-100 text-zinc-700 border-violet-500'
                      }`}
                    >
                      <span className="font-extrabold text-[10px] block opacity-80">
                        Membalas {msg.replyTo.role === 'user' ? 'Anda' : 'Violet AI'}:
                      </span>
                      <p className="truncate line-clamp-1 italic text-[11px] opacity-90">{msg.replyTo.text}</p>
                    </div>
                  )}

                  {/* User sent image preview */}
                  {msg.image && (
                    <div className="mb-2 rounded-xl overflow-hidden border border-white/40 w-fit max-w-sm cursor-zoom-in hover:opacity-90 transition-opacity">
                      <img 
                        src={msg.image} 
                        alt="Uploaded attachment" 
                        className="max-h-72 w-auto object-cover block cursor-zoom-in" 
                        onDoubleClick={() => setZoomedImage(msg.image)}
                        title="Klik dua kali (double click) untuk memperbesar"
                      />
                    </div>
                  )}

                  {(() => {
                    const { stickersFound, cleanText } = parseMessageContent(msg.text, msg.sticker);
                    return (
                      <div className="flex flex-col gap-2">
                        {stickersFound.length > 0 && (
                          <div className={`flex flex-wrap items-center gap-2.5 my-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {stickersFound.map((stkId, sIdx) => (
                              <div key={sIdx} className="p-1 rounded-2xl bg-white/10 hover:scale-105 transition-transform">
                                <StickerVisual 
                                  id={stkId} 
                                  size={110} 
                                  animate={true} 
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {cleanText ? (
                          msg.role === 'user' ? (
                            <p className="whitespace-pre-wrap font-medium">{cleanText}</p>
                          ) : (
                            <div>
                              <div className={`markdown-body !bg-transparent !font-normal text-[14px] sm:text-[15px] ${isErrorMsg ? '!text-red-800' : '!text-zinc-800'}`} style={{ backgroundColor: 'transparent' }}>
                                <Markdown>{cleanText}</Markdown>
                              </div>
                              {isErrorMsg && (
                                <div className="mt-2.5 pt-2 border-t border-red-200/80 flex items-center justify-between gap-2">
                                  <button
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="px-2.5 py-1 text-xs font-bold text-red-700 bg-red-100/90 hover:bg-red-200/90 rounded-lg transition-all flex items-center gap-1.5"
                                  >
                                    <Settings className="w-3.5 h-3.5" />
                                    Buka Pengaturan API Key
                                  </button>
                                </div>
                              )}
                            </div>
                          )
                        ) : null}
                      </div>
                    );
                  })()}

                  {/* Compact Action Toolbar */}
                  <div 
                    className={`mt-2 pt-1.5 border-t flex items-center justify-between gap-1 text-xs ${
                      msg.role === 'user' ? 'border-white/20 text-white/90' : 'border-zinc-100 text-zinc-500'
                    }`}
                  >
                    <span className="text-[10px] font-bold opacity-75">
                      {msg.role === 'user' ? 'Anda' : 'Violet AI (Hermes)'}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Copy Button */}
                      <button
                        onClick={() => copyToClipboard(msg.text, i)}
                        className={`p-1 rounded-md transition-all flex items-center gap-1 ${
                          msg.role === 'user' ? 'hover:bg-white/20' : 'hover:bg-zinc-100'
                        }`}
                        title="Salin Teks (Copy)"
                      >
                        {copiedIndex === i ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[10px] hidden sm:inline">
                          {copiedIndex === i ? 'Tersalin' : 'Salin'}
                        </span>
                      </button>

                      {/* Reply Button */}
                      <button
                        onClick={() => startReply(i, msg)}
                        className={`p-1 rounded-md transition-all flex items-center gap-1 ${
                          msg.role === 'user' ? 'hover:bg-white/20' : 'hover:bg-zinc-100'
                        }`}
                        title="Balas pesan ini (Quote/Reply)"
                      >
                        <Reply className="w-3.5 h-3.5" />
                        <span className="text-[10px] hidden sm:inline">Balas</span>
                      </button>

                      {/* User only: Edit Button */}
                      {msg.role === 'user' && (
                        <button
                          onClick={() => editMessage(i)}
                          className="p-1 rounded-md hover:bg-white/20 transition-all flex items-center gap-1"
                          title="Edit & Kirim Ulang"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span className="text-[10px] hidden sm:inline">Edit</span>
                        </button>
                      )}

                      {/* Assistant only: TTS Voice */}
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => toggleSpeech(msg.text, i)}
                          className="p-1 rounded-md hover:bg-zinc-100 transition-all flex items-center gap-1"
                          title={speakingIndex === i ? "Stop suara" : "Dengarkan suara"}
                        >
                          {speakingIndex === i ? (
                            <VolumeX className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                          ) : (
                            <Volume2 className="w-3.5 h-3.5 text-zinc-600" />
                          )}
                          <span className={`text-[10px] hidden sm:inline ${speakingIndex === i ? 'text-red-500 font-bold' : ''}`}>
                            {speakingIndex === i ? 'Stop' : 'Suara'}
                          </span>
                        </button>
                      )}

                      {/* Assistant only: Regenerate on the latest message */}
                      {msg.role === 'assistant' && i === messages.length - 1 && (
                        <button
                          onClick={() => regenerateLastMessage(i)}
                          disabled={isLoading}
                          className="p-1 rounded-md hover:bg-zinc-100 transition-all flex items-center gap-1 disabled:opacity-40"
                          title="Generate Ulang Balasan (Regenerate)"
                        >
                          <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                          <span className="text-[10px] hidden sm:inline">Ulang</span>
                        </button>
                      )}

                      {/* Delete Message Button */}
                      <button
                        onClick={() => deleteMessage(i)}
                        className={`p-1 rounded-md transition-all ${
                          msg.role === 'user' ? 'hover:bg-white/20' : 'hover:bg-red-50 hover:text-red-500'
                        }`}
                        title="Hapus pesan ini"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div 
                className="w-8 h-8 rounded-xl overflow-hidden border-2 flex items-center justify-center shrink-0 mt-0.5"
                style={{ borderColor: theme.border, backgroundColor: theme.lightTint, boxShadow: `2px 2px 0px ${theme.shadow}` }}
              >
                <img src="/src/assets/images/violet_ai_cat_logo_1788467449037.jpg" alt="Violet AI" className="w-full h-full object-cover" />
              </div>
              <div 
                className="px-4 py-3 bg-white border-2 rounded-2xl rounded-tl-sm flex items-center gap-2"
                style={{ borderColor: theme.border, boxShadow: `2px 2px 0px ${theme.shadow}` }}
              >
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.primary, animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.primary, animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: theme.primary, animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-2" />
        </div>
      </main>

      {/* Input Area */}
      <footer className="px-3 sm:px-4 shrink-0 pb-4 sm:pb-5">
        <div className="max-w-2xl sm:max-w-3xl mx-auto relative flex flex-col gap-1.5">
          
          {/* Top Control Bar: Voice Translate, Auto-Speak, Auto-Copy */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 px-0.5 text-xs">
            <div 
              className="flex items-center gap-1 bg-white/95 backdrop-blur-sm border-2 px-2.5 py-1 rounded-xl transition-all"
              style={{ borderColor: theme.border, boxShadow: `1.5px 1.5px 0px ${theme.shadow}` }}
            >
              <Languages className="w-3.5 h-3.5" style={{ color: theme.textDark }} />
              <span className="font-extrabold text-[11px] hidden sm:inline" style={{ color: theme.textDark }}>Translate:</span>
              <select
                value={targetLang}
                onChange={(e) => {
                  const val = e.target.value;
                  setTargetLang(val);
                  if (val === 'off') {
                    stopAllSpeech();
                    showToast("Translate dinonaktifkan & suara dihentikan 🔇");
                  } else {
                    const found = TRANSLATE_LANGUAGES.find(l => l.code === val);
                    showToast(`Mode Terjemahan ${found?.label || val} Aktif 🌐`);
                  }
                }}
                className="bg-transparent font-bold focus:outline-none cursor-pointer text-[11px] py-0.5"
                style={{ color: theme.textDark }}
              >
                {TRANSLATE_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Auto-Copy Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  const next = !autoCopy;
                  setAutoCopy(next);
                  showToast(next ? "Auto-Salin diaktifkan! 📋" : "Auto-Salin dinonaktifkan");
                }}
                className={`flex items-center gap-1 bg-white/95 backdrop-blur-sm border-2 px-2 py-1 rounded-xl font-bold text-[11px] transition-all hover:bg-white`}
                style={{
                  borderColor: theme.border,
                  color: autoCopy ? theme.primary : '#71717a',
                  boxShadow: `1.5px 1.5px 0px ${theme.shadow}`
                }}
                title={autoCopy ? "Auto-Salin Aktif: Otomatis menyalin terjemahan/balasan ke clipboard" : "Auto-Salin Nonaktif"}
              >
                <Copy className={`w-3 h-3 ${autoCopy ? 'text-violet-600' : 'text-zinc-400'}`} />
                <span>{autoCopy ? 'Auto Salin ON' : 'Auto Salin OFF'}</span>
              </button>

              {/* Auto-Speak Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  const next = !autoSpeak;
                  setAutoSpeak(next);
                  if (!next) {
                    stopAllSpeech();
                    showToast("Suara otomatis dinonaktifkan & dihentikan 🔇");
                  } else {
                    showToast("Suara otomatis diaktifkan 🔊");
                  }
                }}
                className="flex items-center gap-1 bg-white/95 backdrop-blur-sm border-2 px-2 py-1 rounded-xl font-bold text-[11px] transition-all hover:bg-white"
                style={{
                  borderColor: theme.border,
                  color: autoSpeak ? theme.primary : '#71717a',
                  boxShadow: `1.5px 1.5px 0px ${theme.shadow}`
                }}
                title={autoSpeak ? "Auto-Speak Aktif: Otomatis membaca dengan suara" : "Auto-Speak Mati"}
              >
                {autoSpeak ? <Volume2 className="w-3 h-3 text-emerald-600" /> : <VolumeX className="w-3 h-3 text-zinc-400" />}
                <span className="hidden xs:inline">{autoSpeak ? 'Suara ON' : 'Suara OFF'}</span>
              </button>
            </div>
          </div>

          {/* Active Speaking Indicator with quick Stop Button */}
          {speakingIndex !== null && (
            <div 
              className="flex items-center justify-between px-3 py-1.5 bg-amber-50 text-amber-900 border-2 border-amber-300 rounded-xl text-xs shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span className="font-bold">Sedang membacakan balasan suara...</span>
              </div>
              <button
                type="button"
                onClick={stopAllSpeech}
                className="flex items-center gap-1 px-2.5 py-0.5 bg-red-600 text-white rounded-lg font-extrabold hover:bg-red-700 transition-colors shadow-xs"
                title="Hentikan semua suara sekarang"
              >
                <VolumeX className="w-3 h-3" />
                Stop Suara
              </button>
            </div>
          )}

          {/* Listening Audio Indicator */}
          {isListening && (
            <div 
              className="flex items-center justify-between px-3 py-2 bg-red-50 text-red-700 border-2 border-red-300 rounded-xl animate-pulse text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="font-bold">Mendengarkan ucapan Anda (Bahasa Indonesia)...</span>
              </div>
              <button
                onClick={toggleListening}
                className="px-2 py-0.5 bg-red-600 text-white rounded-lg font-black hover:bg-red-700 transition-colors"
              >
                Stop
              </button>
            </div>
          )}

          {/* Reply Context Banner Preview */}
          {replyingTo && (
            <div 
              className="flex items-center justify-between px-3 py-1.5 bg-white/95 border-2 rounded-xl text-xs transition-all"
              style={{ borderColor: theme.border, boxShadow: `2px 2px 0px ${theme.shadow}` }}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Reply className="w-3.5 h-3.5 shrink-0 text-violet-600" />
                <div className="truncate">
                  <span className="font-extrabold text-[11px] text-zinc-600 mr-1">
                    Membalas {replyingTo.role === 'user' ? 'Anda' : 'Violet AI'}:
                  </span>
                  <span className="italic text-zinc-500 truncate text-[11px]">{replyingTo.text}</span>
                </div>
              </div>
              <button
                onClick={() => setReplyingTo(null)}
                className="p-1 hover:bg-zinc-100 rounded-md text-zinc-500 ml-2 shrink-0"
                title="Batalkan balasan"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Attached image preview indicator */}
          {attachedImage && (
            <div 
              className="flex items-center gap-2.5 p-2 bg-white rounded-xl border-2 w-fit"
              style={{ borderColor: theme.border, boxShadow: `2px 2px 0px ${theme.shadow}` }}
            >
              <img src={attachedImage.preview} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-zinc-200" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-700">Gambar Terlampir</span>
                <span className="text-[10px] text-zinc-400">Siap dianalisa</span>
              </div>
              <button 
                onClick={() => setAttachedImage(null)}
                className="p-1 hover:bg-zinc-100 rounded-md text-zinc-500"
                title="Hapus gambar"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Compact Input Box */}
          <div 
            className="relative flex items-end rounded-2xl bg-white border-2 transition-all focus-within:translate-y-0.5"
            style={{
              borderColor: theme.border,
              boxShadow: `3px 3px 0px ${theme.shadow}`
            }}
          >
            {/* Attachment Button */}
            <label 
              className="p-2.5 mb-1 ml-1.5 rounded-xl cursor-pointer hover:bg-zinc-100 transition-colors flex items-center justify-center shrink-0"
              title="Lampirkan Gambar untuk Analisa Visi"
            >
              <Paperclip className="w-4 h-4 text-zinc-500 hover:text-zinc-800" />
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageAttachment} 
              />
            </label>

            {/* Microphone Button (Speech to Text in Indonesian) */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 mb-1 ml-0.5 rounded-xl cursor-pointer transition-all flex items-center justify-center shrink-0 ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse shadow-md' 
                  : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800'
              }`}
              title={isListening ? "Mendengarkan... (Klik untuk stop)" : "Bicara dengan Suara (Bahasa Indonesia)"}
            >
              {isListening ? <Mic className="w-4 h-4 text-white animate-bounce" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Sticker Button */}
            <button
              type="button"
              onClick={() => setIsStickerPickerOpen(true)}
              className={`p-2.5 mb-1 ml-0.5 rounded-xl cursor-pointer transition-all flex items-center justify-center shrink-0 hover:bg-zinc-100 text-zinc-500 hover:text-violet-600 ${
                isStickerPickerOpen ? 'bg-violet-100 text-violet-600' : ''
              }`}
              title="Pilih Stiker Anime Cat (Kirim Stiker)"
            >
              <Smile className="w-4 h-4" />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={
                isListening 
                  ? "Sedang mendengarkan ucapan Anda..." 
                  : targetLang !== 'off' 
                    ? `Bicara / ketik -> terjemahkan ke ${TRANSLATE_LANGUAGES.find(l => l.code === targetLang)?.label}...` 
                    : attachedImage 
                      ? "Tanyakan sesuatu tentang gambar ini..." 
                      : replyingTo 
                        ? "Ketik balasan Anda..."
                        : "Ask Violet something (atau klik mikrofon untuk bicara)..."
              }
              className="w-full bg-transparent rounded-2xl pl-1.5 pr-12 py-2.5 text-sm sm:text-[15px] font-medium placeholder:opacity-40 focus:outline-none resize-none max-h-36 min-h-[44px]"
              style={{ color: theme.textDark }}
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={(!input.trim() && !attachedImage) || isLoading}
              className="absolute right-1.5 bottom-1.5 p-2 rounded-xl border-2 text-white disabled:opacity-50 disabled:bg-zinc-300 disabled:border-zinc-400 disabled:text-zinc-500 transition-all active:shadow-none active:translate-y-[1px]"
              style={{
                backgroundColor: theme.primary,
                borderColor: theme.border,
                boxShadow: `1.5px 1.5px 0px ${theme.shadow}`
              }}
              title="Kirim pesan (Enter)"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white border-4 rounded-3xl w-full max-w-md flex flex-col overflow-hidden max-h-[90vh]"
            style={{
              borderColor: theme.border,
              boxShadow: `8px 8px 0px ${theme.shadow}`
            }}
          >
            <div 
              className="flex items-center justify-between px-6 py-4 border-b-4"
              style={{ backgroundColor: theme.lightTint, borderColor: theme.border }}
            >
              <h2 className="font-black text-xl" style={{ color: theme.textDark }}>Customization & Settings</h2>
              <button 
                onClick={() => setIsSettingsOpen(false)} 
                className="hover:opacity-75 transition-colors bg-white border-2 rounded-lg p-1"
                style={{ borderColor: theme.border, color: theme.textDark }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-8 overflow-y-auto">
              
              {/* Appearance */}
              <div className="space-y-4">
                <label className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: theme.textDark }}>
                  <Palette className="w-4 h-4" /> Appearance (Auto-Adaptive Theme)
                </label>
                
                <div className="space-y-3">
                  <p className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
                    Solid Background Color <Sparkles className="w-3.5 h-3.5 text-amber-500 inline" />
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { hex: '#fef2f2', label: 'Pink Rose' },
                      { hex: '#fdf4ff', label: 'Violet Soft' },
                      { hex: '#e0e7ff', label: 'Indigo Sky' },
                      { hex: '#fffbeb', label: 'Warm Amber' },
                      { hex: '#f0fdf4', label: 'Emerald Mint' },
                      { hex: '#f0f9ff', label: 'Cyan Ocean' },
                      { hex: '#fafafa', label: 'Classic Gray' }
                    ].map(item => (
                      <button
                        key={item.hex}
                        onClick={() => { setBgColor(item.hex); setBgImage(''); }}
                        className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-110 ${bgColor === item.hex && !bgImage ? 'scale-110' : 'border-zinc-200'}`}
                        style={{ 
                          backgroundColor: item.hex,
                          borderColor: bgColor === item.hex && !bgImage ? theme.border : undefined,
                          boxShadow: bgColor === item.hex && !bgImage ? `2px 2px 0px ${theme.shadow}` : undefined
                        }}
                        title={item.label}
                      />
                    ))}
                    <div 
                      className="relative overflow-hidden w-10 h-10 rounded-full border-2 flex items-center justify-center bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-300 hover:scale-110 transition-transform cursor-pointer"
                      style={{ borderColor: theme.border }}
                      title="Custom Color Picker"
                    >
                       <input 
                         type="color" 
                         value={bgColor} 
                         onChange={(e) => { setBgColor(e.target.value); setBgImage(''); }}
                         className="absolute inset-0 w-14 h-14 -top-2 -left-2 opacity-0 cursor-pointer"
                       />
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-zinc-400">
                    Semua warna garis, bayangan, tombol, dan balon chat akan otomatis menyesuaikan dengan warna background!
                  </p>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-zinc-500">Custom Background Image</p>
                  <label 
                    className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all font-bold text-sm"
                    style={{ 
                      backgroundColor: theme.lighterTint, 
                      borderColor: theme.border,
                      color: theme.textDark 
                    }}
                  >
                    <ImageIcon className="w-5 h-5" />
                    Upload Image (Auto-Adapts Colors)
                    <input type="file" accept="image/*" onChange={handleBgImageUpload} className="hidden" />
                  </label>
                  {bgImage && (
                    <button onClick={() => setBgImage('')} className="text-xs font-bold text-red-500 hover:underline">
                      Remove Custom Image
                    </button>
                  )}
                </div>
              </div>

              {/* Models */}
              <div className="space-y-4">
                <label className="text-sm font-black uppercase tracking-widest" style={{ color: theme.textDark }}>AI Model</label>
                <div className="grid grid-cols-1 gap-3">
                  {GEMINI_MODELS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setModel(m.id)}
                      className={`px-4 py-3 rounded-xl text-sm text-left flex items-center justify-between border-2 transition-all font-bold ${
                        model === m.id 
                          ? 'border-2' 
                          : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400'
                      }`}
                      style={model === m.id ? {
                        backgroundColor: theme.lightTint,
                        color: theme.textDark,
                        borderColor: theme.border,
                        boxShadow: `2px 2px 0px ${theme.shadow}`
                      } : {}}
                    >
                      <span>{m.label}</span>
                      {model === m.id && <Check className="w-5 h-5" style={{ color: theme.textDark }} />}
                    </button>
                  ))}
                </div>
                
                <div className="pt-2">
                  <button
                    onClick={testConnection}
                    disabled={isTestingConnection}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-bold text-sm transition-all disabled:opacity-50"
                    style={{
                      backgroundColor: isTestingConnection ? theme.lightTint : 'white',
                      borderColor: theme.border,
                      color: theme.textDark,
                      boxShadow: isTestingConnection ? 'none' : `2px 2px 0px ${theme.shadow}`
                    }}
                  >
                    {isTestingConnection ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Menguji Koneksi...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Tes Koneksi Model Aktif
                      </span>
                    )}
                  </button>
                  {activeModelName && !isTestingConnection && (
                    <p className="mt-2 text-xs font-bold text-center" style={{ color: theme.primary }}>
                      ✅ Berhasil terhubung ke: <span className="bg-white px-2 py-0.5 rounded border">{activeModelName}</span>
                    </p>
                  )}
                </div>
              </div>
              
              {/* API Key */}
              <div className="space-y-3">
                <label className="text-sm font-black uppercase tracking-widest flex justify-between" style={{ color: theme.textDark }}>
                  <span>Custom Gemini API Key</span>
                  {apiKey && (
                    <span className="text-xs font-bold text-emerald-600">Aktif</span>
                  )}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Paste AI Studio Gemini API Key (AIzaSy...)..."
                  className="w-full bg-zinc-50 border-2 border-zinc-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none transition-all text-zinc-900"
                  style={{
                    borderColor: apiKey ? theme.border : undefined
                  }}
                />
                <div className="flex flex-col gap-1 text-xs">
                  <p className="font-medium text-zinc-500">
                    Masukkan Gemini API Key pribadi Anda jika kunci bawaan server sedang limit atau sibuk. Kunci tersimpan aman secara lokal di browser Anda.
                  </p>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold underline flex items-center gap-1 hover:opacity-80 transition-opacity"
                    style={{ color: theme.primary }}
                  >
                    Dapatkan Gemini API Key Gratis di Google AI Studio →
                  </a>
                </div>
              </div>

              {/* Chat Preferences */}
              <div className="space-y-3 pt-2 border-t-2 border-zinc-200">
                <label className="text-sm font-black uppercase tracking-widest text-zinc-800 flex items-center gap-2">
                  <Copy className="w-4 h-4" /> Preferensi Chat
                </label>
                
                <div className="flex items-center justify-between p-3 rounded-xl border-2 border-zinc-200 bg-zinc-50">
                  <div>
                    <p className="text-xs font-bold text-zinc-800">Auto-Salin Balasan (Clipboard)</p>
                    <p className="text-[11px] text-zinc-500">Otomatis menyalin teks respons AI ke clipboard setelah selesai dibuat.</p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !autoCopy;
                      setAutoCopy(next);
                      showToast(next ? "Auto-Salin diaktifkan! 📋" : "Auto-Salin dinonaktifkan");
                    }}
                    className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      autoCopy ? 'bg-violet-600 justify-end' : 'bg-zinc-300 justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border-2 border-zinc-200 bg-zinc-50">
                  <div>
                    <p className="text-xs font-bold text-zinc-800">Ekspor Obrolan</p>
                    <p className="text-[11px] text-zinc-500">Unduh seluruh riwayat percakapan dalam format Markdown (.md).</p>
                  </div>
                  <button
                    onClick={exportChat}
                    disabled={messages.length === 0}
                    className="px-3 py-1.5 bg-white border-2 border-zinc-300 rounded-lg text-xs font-bold hover:bg-zinc-100 disabled:opacity-40 transition-all flex items-center gap-1.5"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Unduh
                  </button>
                </div>
              </div>

              {/* Data Management */}
              <div className="space-y-3 pt-2 border-t-2 border-zinc-200">
                <label className="text-sm font-black uppercase tracking-widest text-zinc-800">Data Management</label>
                {showClearChatConfirm ? (
                  <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl space-y-2.5">
                    <p className="text-xs font-bold text-red-700">
                      ⚠️ Yakin ingin menghapus seluruh riwayat obrolan {messages.length > 0 ? `(${messages.length} pesan)` : ''}?
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowClearChatConfirm(false)}
                        className="flex-1 py-1.5 px-3 bg-white border border-zinc-300 rounded-lg text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-colors"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={executeClearChat}
                        className="flex-1 py-1.5 px-3 bg-red-600 text-white rounded-lg text-xs font-black hover:bg-red-700 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Ya, Hapus
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={clearChat}
                    disabled={messages.length === 0}
                    className="w-full px-4 py-2.5 bg-red-50 text-red-600 border-2 border-red-200 rounded-xl font-bold hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All Chat History {messages.length > 0 ? `(${messages.length} pesan)` : '(Kosong)'}
                  </button>
                )}
              </div>
            </div>
            
            <div 
              className="px-6 py-4 border-t-4 flex justify-end"
              style={{ backgroundColor: theme.lightTint, borderColor: theme.border }}
            >
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-3 text-white border-2 rounded-xl text-sm font-black transition-all active:translate-y-1 active:translate-x-1"
                style={{
                  backgroundColor: theme.primary,
                  borderColor: theme.border,
                  boxShadow: `4px 4px 0px ${theme.shadow}`
                }}
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Workspace Files Explorer Modal */}
      {isWorkspaceOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white border-4 rounded-3xl w-full max-w-lg flex flex-col overflow-hidden max-h-[85vh]"
            style={{
              borderColor: theme.border,
              boxShadow: `8px 8px 0px ${theme.shadow}`
            }}
          >
            <div 
              className="flex items-center justify-between px-6 py-4 border-b-4"
              style={{ backgroundColor: theme.lightTint, borderColor: theme.border }}
            >
              <div className="flex items-center gap-2">
                <Folder className="w-6 h-6" style={{ color: theme.textDark }} />
                <h2 className="font-black text-xl" style={{ color: theme.textDark }}>Workspace Storage</h2>
              </div>
              <button 
                onClick={() => setIsWorkspaceOpen(false)} 
                className="hover:opacity-75 transition-colors bg-white border-2 rounded-lg p-1"
                style={{ borderColor: theme.border, color: theme.textDark }}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-zinc-500">
                  File yang ditulis atau dibaca oleh Violet AI tersimpan di <code className="bg-zinc-100 px-1.5 py-0.5 rounded border">/workspace</code>.
                </p>
                <button
                  onClick={loadWorkspaceFiles}
                  className="text-xs font-bold px-2.5 py-1 rounded-lg border hover:bg-zinc-50"
                  style={{ borderColor: theme.border }}
                >
                  Refresh
                </button>
              </div>

              {loadingFiles ? (
                <div className="py-12 text-center text-zinc-400 font-bold">Memuat file workspace...</div>
              ) : workspaceFiles.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center gap-2 text-zinc-400">
                  <Folder className="w-12 h-12 stroke-[1.5] opacity-40" />
                  <p className="font-bold text-sm">Belum ada file di workspace.</p>
                  <p className="text-xs">Minta Violet AI menulis file (contoh: "Violet, tolong simpan ringkasan ini ke file catatan.md").</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {workspaceFiles.map(file => (
                    <div 
                      key={file.name}
                      className="flex items-center justify-between p-3 rounded-xl border-2 hover:border-zinc-400 transition-colors bg-zinc-50"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-white rounded-lg border text-zinc-600">
                          <Folder className="w-4 h-4" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-zinc-800 truncate">{file.name}</p>
                          <p className="text-[11px] text-zinc-400 font-medium">
                            {(file.size / 1024).toFixed(1)} KB • {new Date(file.updatedAt).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <a 
                          href={`/api/workspace/files/${encodeURIComponent(file.name)}`}
                          download={file.name}
                          className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-zinc-300 text-zinc-600 transition-colors"
                          title="Unduh File"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => deleteWorkspaceFile(file.name)}
                          className="p-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                          title="Hapus File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div 
              className="px-6 py-4 border-t-4 flex justify-between items-center"
              style={{ backgroundColor: theme.lightTint, borderColor: theme.border }}
            >
              <span className="text-xs font-bold text-zinc-500">
                Total: {workspaceFiles.length} file
              </span>
              <button
                onClick={() => setIsWorkspaceOpen(false)}
                className="px-5 py-2 text-white border-2 rounded-xl text-xs font-black transition-all"
                style={{
                  backgroundColor: theme.primary,
                  borderColor: theme.border,
                  boxShadow: `2px 2px 0px ${theme.shadow}`
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Zoom Gambar */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <button 
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-2 rounded-full text-white transition-colors"
            onClick={() => setZoomedImage(null)}
            title="Tutup (Esc)"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={zoomedImage} 
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl cursor-default" 
            onClick={(e) => e.stopPropagation()} 
            alt="Zoomed preview"
          />
        </div>
      )}

      {/* Modal Konfirmasi Hapus Semua Riwayat Chat */}
      {showClearChatConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div 
            className="w-full max-w-sm bg-white rounded-2xl border-3 p-5 shadow-2xl space-y-4"
            style={{ 
              borderColor: theme.border, 
              boxShadow: `6px 6px 0px ${theme.shadow}` 
            }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 rounded-xl border border-red-200 text-red-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900">Hapus Semua Riwayat?</h3>
                <p className="text-[11px] font-semibold text-zinc-500">Tindakan ini permanen</p>
              </div>
            </div>
            
            <p className="text-xs font-semibold text-zinc-600 leading-relaxed">
              Semua {messages.length > 0 ? `${messages.length} pesan ` : ''}riwayat obrolan dengan Violet AI akan dihapus secara permanen dari browser ini. Lanjutkan?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowClearChatConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border-2 text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-all cursor-pointer"
                style={{ borderColor: theme.border }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeClearChat}
                className="px-4 py-2 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus File Workspace */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div 
            className="w-full max-w-sm bg-white rounded-2xl border-3 p-5 shadow-2xl space-y-4"
            style={{ 
              borderColor: theme.border, 
              boxShadow: `6px 6px 0px ${theme.shadow}` 
            }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-100 rounded-xl border border-red-200 text-red-600">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-zinc-900">Hapus File Workspace?</h3>
                <p className="text-[11px] font-semibold text-zinc-500">File akan dihapus dari server</p>
              </div>
            </div>
            
            <p className="text-xs font-semibold text-zinc-600 leading-relaxed">
              Yakin ingin menghapus file <strong className="text-zinc-900 break-all font-bold">'{fileToDelete}'</strong> dari workspace?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border-2 text-zinc-700 bg-zinc-100 hover:bg-zinc-200 transition-all cursor-pointer"
                style={{ borderColor: theme.border }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteWorkspaceFile}
                className="px-4 py-2 rounded-xl text-xs font-black text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticker Picker Modal */}
      <StickerPicker
        isOpen={isStickerPickerOpen}
        onClose={() => setIsStickerPickerOpen(false)}
        onSelectSticker={sendStickerMessage}
        theme={theme}
      />
    </div>
  );
}
