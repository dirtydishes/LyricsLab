export type FirstFrameHost = {
  readonly cancelFrame: (handle: number) => void;
  readonly cancelIdle: (handle: number) => void;
  readonly requestFrame: (callback: () => void) => number;
  readonly requestIdle: (callback: () => void) => number;
};

export function createAfterFirstFrameScheduler(host: FirstFrameHost) {
  return (task: () => void) => {
    let firstFrame = 0;
    let secondFrame = 0;
    let idle = 0;
    let cancelled = false;

    firstFrame = host.requestFrame(() => {
      secondFrame = host.requestFrame(() => {
        if (cancelled) return;
        idle = host.requestIdle(task);
      });
    });

    return () => {
      cancelled = true;
      host.cancelFrame(firstFrame);
      if (secondFrame) host.cancelFrame(secondFrame);
      if (idle) host.cancelIdle(idle);
    };
  };
}
