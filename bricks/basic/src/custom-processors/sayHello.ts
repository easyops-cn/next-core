import { customProcessors } from "@next-core/runtime";

export function sayHello() {
  return "Hello from processor";
}

customProcessors.define("basic.sayHello", sayHello);
