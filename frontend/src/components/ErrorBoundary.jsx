import { Component } from "react";

/**
 * Catches render-time errors in a single dashboard page (e.g. an API call
 * that returned unexpected shape) so they degrade to an inline message
 * instead of unmounting the entire app to a blank white screen.
 *
 * React only supports error boundaries as class components (no hook
 * equivalent yet) — see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
 */
export default class ErrorBoundary extends Component {
    state = { error: null };

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error("Dashboard page crashed:", error, info);
    }

    componentDidUpdate(prevProps) {
        // Recover automatically on navigation (route/key change) rather than
        // staying stuck on the error screen for every page after one crash.
        if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
            this.setState({ error: null });
        }
    }

    render() {
        if (this.state.error) {
            return (
                <div className="dash-card">
                    <div className="dash-empty" style={{ color: "var(--destructive)" }}>
                        Something went wrong loading this page.
                        <div style={{ marginTop: 6, fontSize: 12, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                            {this.state.error.message}
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
