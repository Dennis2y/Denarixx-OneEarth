import React from "react";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = {
  hasError: boolean;
};

export default class GlobeErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
  };

  static getDerivedStateFromError(): State {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: unknown) {
    console.error("ThreatGlobe crashed; switching to 2D map:", error);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex h-[420px] items-center justify-center rounded-xl border border-border bg-card p-8 text-center">
          <div>
            <h2 className="text-xl font-semibold">
              Live Threat Map Unavailable
            </h2>

            <p className="mt-3 text-muted-foreground">
              The visualization could not be loaded.
            </p>

            <p className="mt-2 text-sm text-muted-foreground">
              All monitoring, alerts and analytics continue operating normally.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
