/// <reference types="jest" />

import { createAfterFirstFrameScheduler } from '../../platform/afterFirstFrameScheduler';

describe('post-first-frame scheduler', () => {
  it('requires two frames and an idle turn before starting work', () => {
    const frames: Array<() => void> = [];
    const idle: Array<() => void> = [];
    const task = jest.fn();
    const schedule = createAfterFirstFrameScheduler({
      cancelFrame: jest.fn(),
      cancelIdle: jest.fn(),
      requestFrame(callback) {
        frames.push(callback);
        return frames.length;
      },
      requestIdle(callback) {
        idle.push(callback);
        return idle.length;
      },
    });

    schedule(task);
    expect(task).not.toHaveBeenCalled();
    frames.shift()?.();
    expect(task).not.toHaveBeenCalled();
    frames.shift()?.();
    expect(task).not.toHaveBeenCalled();
    idle.shift()?.();
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('cancels queued frame work before acquisition can start', () => {
    const frames: Array<() => void> = [];
    const task = jest.fn();
    const cancelFrame = jest.fn();
    const schedule = createAfterFirstFrameScheduler({
      cancelFrame,
      cancelIdle: jest.fn(),
      requestFrame(callback) {
        frames.push(callback);
        return frames.length;
      },
      requestIdle: jest.fn(() => 1),
    });

    const cancel = schedule(task);
    cancel();
    frames.shift()?.();
    frames.shift()?.();
    expect(task).not.toHaveBeenCalled();
    expect(cancelFrame).toHaveBeenCalledWith(1);
  });
});
