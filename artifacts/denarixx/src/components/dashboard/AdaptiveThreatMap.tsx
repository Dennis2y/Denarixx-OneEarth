import React, { Suspense, lazy, useMemo } from "react";
import GlobeErrorBoundary from "@/components/common/GlobeErrorBoundary";

const ThreatGlobe = lazy(() => import("./ThreatGlobe"));
const ThreatMap2D = lazy(() => import("./ThreatMap2D"));

type ThreatGlobeProps = React.ComponentProps<
  (typeof import("./ThreatGlobe"))["default"]
>;

function supportsWebGL(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");

    const context =
      canvas.getContext("webgl2", {
        failIfMajorPerformanceCaveat: true,
      }) ||
      canvas.getContext("webgl", {
        failIfMajorPerformanceCaveat: true,
      }) ||
      canvas.getContext("experimental-webgl");

    return Boolean(context);
  } catch {
    return false;
  }
}

function LoadingVisualization() {
  return (
    <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-cyan-500/20 bg-slate-950/70">
      <div className="text-sm text-muted-foreground">
        Loading global visualization…
      </div>
    </div>
  );
}

export default function AdaptiveThreatMap(
  props: ThreatGlobeProps,
) {
  const webglAvailable = useMemo(() => supportsWebGL(), []);

  const fallbackMap = (
    <Suspense fallback={<LoadingVisualization />}>
      <ThreatMap2D
        sites={props.sites}
        escalations={props.escalations}
        liveFlashToken={props.liveFlashToken}
      />
    </Suspense>
  );

  if (!webglAvailable) {
    return fallbackMap;
  }

  return (
    <GlobeErrorBoundary fallback={fallbackMap}>
      <Suspense fallback={<LoadingVisualization />}>
        <ThreatGlobe {...props} />
      </Suspense>
    </GlobeErrorBoundary>
  );
}
