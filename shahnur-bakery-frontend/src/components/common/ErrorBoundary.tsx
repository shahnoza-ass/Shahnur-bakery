import { Component, ErrorInfo, ReactNode } from 'react';
import { HiOutlineRefresh } from 'react-icons/hi';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Log error to service (optional)
    // logErrorToService(error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center">
          <div className="text-6xl mb-4">😅</div>
          <h2 className="font-display text-2xl font-bold text-dark-800 mb-2">
            Kechirasiz, xatolik yuz berdi
          </h2>
          <p className="text-dark-500 mb-6 max-w-md">
            {this.state.error?.message || 'Noma\'lum xatolik yuz berdi. Iltimos, qaytadan urinib ko\'ring.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary flex items-center gap-2"
          >
            <HiOutlineRefresh className="w-5 h-5" />
            Qayta yuklash
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}