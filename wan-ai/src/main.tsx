import { StrictMode, Component, ReactNode, ErrorInfo } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('violet-ai-messages');
    } catch (e) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-violet-50 text-zinc-800">
          <div className="max-w-md w-full bg-white rounded-2xl border-3 border-zinc-900 p-6 shadow-[6px_6px_0px_#18181b] space-y-4 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-3xl">
              🐱⚠️
            </div>
            <h2 className="text-xl font-black text-zinc-900">Oops, Violet Terhenti Sejenak</h2>
            <p className="text-xs font-semibold text-zinc-600 leading-relaxed">
              Terjadi kendala memori atau rendering pada browser saat memproses tampilan. Klik tombol di bawah untuk memulihkan aplikasi secara otomatis.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-2.5 px-4 bg-violet-600 text-white font-black text-xs rounded-xl border-2 border-zinc-900 shadow-[3px_3px_0px_#18181b] hover:bg-violet-700 active:translate-y-0.5 transition-all cursor-pointer"
              >
                Muat Ulang
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-zinc-100 text-zinc-700 font-bold text-xs rounded-xl border-2 border-zinc-900 hover:bg-zinc-200 active:translate-y-0.5 transition-all cursor-pointer"
              >
                Reset Chat
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
