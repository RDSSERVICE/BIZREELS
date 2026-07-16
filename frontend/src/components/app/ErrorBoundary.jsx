import { Component } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("BizReels ErrorBoundary", error, info); }
  reload = () => { this.setState({ hasError: false, error: null }); window.location.reload(); };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6" data-testid="error-boundary">
        <div className="max-w-md text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-500/20 text-red-300 mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="font-heading text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-sm text-white/60 mb-6">
            An unexpected error occurred. Our team has been notified. Reload the app to continue.
          </p>
          <button
            onClick={this.reload}
            data-testid="error-reload-btn"
            className="h-11 px-6 rounded-full btn-brand border-0 font-semibold inline-flex items-center gap-2"
          >
            <RotateCw className="h-4 w-4" /> Reload
          </button>
        </div>
      </div>
    );
  }
}
