import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
  onError?: () => void;
}

interface State {
  error: Error | null;
}

/** Catches lazy/chunk failures so /configurator isn't a blank black screen */
export default class SceneErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Configurator scene error:", error);
    this.props.onError?.();
  }

  render() {
    if (!this.state.error) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div role="alert" className="w-full h-full flex flex-col items-center justify-center gap-4 px-6 text-center bg-premium-black">
        <p className="font-display text-sm uppercase tracking-[0.25em] text-white/70">
          3D Studio failed to load
        </p>
        <p className="font-body text-xs text-white/40 max-w-sm break-words">
          {this.state.error.message || "Unknown error"}
        </p>
        <button
          type="button"
          onClick={() => {
            this.props.onRetry?.();
            window.location.reload();
          }}
          className="mt-2 px-6 py-3 bg-white text-black font-body text-xs uppercase tracking-[0.2em] hover:bg-white/90 cursor-pointer"
        >
          Reload
        </button>
      </div>
    );
  }
}
