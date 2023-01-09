const runtime = {
  registerCustomProcessor(...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.log("registerCustomProcessor:", ...args);
  },
};

export function sayHello() {
  // eslint-disable-next-line no-console
  console.log("Hello from processor");
}

runtime.registerCustomProcessor("basic.sayHello", sayHello);
