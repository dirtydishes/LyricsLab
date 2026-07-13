export type FirstFrameHost = {
  readonly cancelFrame: (handle: number) => void;
  readonly cancelIdle: (handle: number) => void;
  readonly requestFrame: (callback: () => void) => number;
  readonly requestIdle: (callback: () => void) => number;
};

const IDLE_FALLBACK_MS = 250;

export function createAfterFirstFrameScheduler(host: FirstFrameHost) {
  return (task: () => void) => {
    let firstFrame = 0;
    let secondFrame = 0;
    let idle = 0;
    let fallback: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    let finished = false;

    const runTask = () => {
      if (cancelled || finished) return;
      finished = true;
      if (idle) {
        try {
          host.cancelIdle(idle);
        } catch {
          // An unsupported native idle scheduler must not prevent startup.
        }
        idle = 0;
      }
      if (fallback !== null) {
        clearTimeout(fallback);
        fallback = null;
      }
      task();
    };

    firstFrame = host.requestFrame(() => {
      if (cancelled) return;
      secondFrame = host.requestFrame(() => {
        if (cancelled) return;
        fallback = setTimeout(runTask, IDLE_FALLBACK_MS);
        try {
          const handle = host.requestIdle(runTask);
          if (cancelled || finished) {
            host.cancelIdle(handle);
          } else {
            idle = handle;
          }
        } catch {
          // The bounded fallback owns startup on hosts without idle support.
        }
      });
    });

    return () => {
      cancelled = true;
      host.cancelFrame(firstFrame);
      if (secondFrame) host.cancelFrame(secondFrame);
      if (idle) {
        try {
          host.cancelIdle(idle);
        } catch {
          // Cancellation remains best-effort on unsupported native hosts.
        }
      }
      if (fallback !== null) clearTimeout(fallback);
    };
  };
}
