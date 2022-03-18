import type { SimpleFunction } from "@next-core/brick-types";

// The debounce function receives our function as a parameter
export function debounceByAnimationFrame<P extends unknown[]>(
  fn: SimpleFunction<P, void>
): SimpleFunction<P, void> {
  // This holds the requestAnimationFrame reference, so we can cancel it if we wish
  let frame: number;

  // The debounce function returns a new function that can receive a variable number of arguments
  return (...params: P) => {
    // If the frame variable has been defined, clear it now, and queue for next frame
    if (frame) {
      cancelAnimationFrame(frame);
    }

    // Queue our function call for the next frame
    frame = requestAnimationFrame(() => {
      // Call our function and pass any params we received
      fn(...params);
    });
  };
}
