/// <reference types="jest" />

import { createAfterFirstFrameScheduler } from '../../platform/afterFirstFrameScheduler';

describe('post-first-frame scheduler', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

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

  it('guards against an idle callback racing with cancellation', () => {
    const frames: Array<() => void> = [];
    const idle: Array<() => void> = [];
    const task = jest.fn();
    const cancelIdle = jest.fn();
    const schedule = createAfterFirstFrameScheduler({
      cancelFrame: jest.fn(),
      cancelIdle,
      requestFrame(callback) {
        frames.push(callback);
        return frames.length;
      },
      requestIdle(callback) {
        idle.push(callback);
        return idle.length;
      },
    });

    const cancel = schedule(task);
    frames.shift()?.();
    frames.shift()?.();
    cancel();
    idle.shift()?.();

    expect(cancelIdle).toHaveBeenCalledWith(1);
    expect(task).not.toHaveBeenCalled();
  });

  it('falls back without throwing when the native idle scheduler is unsupported', () => {
    jest.useFakeTimers();
    const frames: Array<() => void> = [];
    const task = jest.fn();
    const schedule = createAfterFirstFrameScheduler({
      cancelFrame: jest.fn(),
      cancelIdle: jest.fn(),
      requestFrame(callback) {
        frames.push(callback);
        return frames.length;
      },
      requestIdle() {
        throw new Error(
          'requestIdleCallback is not supported in legacy runtime scheduler',
        );
      },
    });

    schedule(task);
    frames.shift()?.();
    expect(() => frames.shift()?.()).not.toThrow();
    expect(task).not.toHaveBeenCalled();

    jest.advanceTimersByTime(250);
    expect(task).toHaveBeenCalledTimes(1);
  });

  it('uses a bounded fallback when the native idle callback never arrives', () => {
    jest.useFakeTimers();
    const frames: Array<() => void> = [];
    const idle: Array<() => void> = [];
    const task = jest.fn();
    const cancelIdle = jest.fn();
    const schedule = createAfterFirstFrameScheduler({
      cancelFrame: jest.fn(),
      cancelIdle,
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
    frames.shift()?.();
    frames.shift()?.();
    expect(task).not.toHaveBeenCalled();

    jest.advanceTimersByTime(250);
    expect(task).toHaveBeenCalledTimes(1);
    expect(cancelIdle).toHaveBeenCalledWith(1);

    idle.shift()?.();
    expect(task).toHaveBeenCalledTimes(1);
  });
});
