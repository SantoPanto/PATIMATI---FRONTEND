import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  title?: string;
  message?: string;
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
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="my-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-6 text-slate-800 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <AlertTriangle size={22} />
            </span>

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-amber-950">
                {this.props.title || "Bu bölüm görüntülenirken bir sorun oluştu."}
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                {this.props.message ||
                  "Lütfen sayfayı yenileyin veya tekrar deneyin."}
              </p>

              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-amber-600 px-3 text-xs font-semibold text-white transition hover:bg-amber-700"
                >
                  <RefreshCw size={14} />
                  Tekrar Dene
                </button>

                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 text-xs font-semibold text-slate-700 transition hover:bg-amber-100/50"
                >
                  Sayfayı Yenile
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
