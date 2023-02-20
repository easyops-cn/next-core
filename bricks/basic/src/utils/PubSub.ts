import { remove } from "lodash";

export class PubSub {
  #topics: Record<string, { token: string; func: Function }[]> = {};
  #subUid = 0;

  publish(topic: string, body: any): void {
    if (!this.#topics[topic]) {
      return;
    }
    const subscribers = this.#topics[topic];
    let len = subscribers ? subscribers.length : 0;
    while (len--) {
      subscribers[len].func(topic, body);
    }
  }

  subscribe(topic: string, fn: (topic: string, detail: any) => void): string {
    if (!this.#topics[topic]) {
      this.#topics[topic] = [];
    }
    const token = (++this.#subUid).toString();
    this.#topics[topic].push({
      token: token,
      func: fn,
    });
    return token;
  }

  unsubscribe(token: string): void {
    for (const m in this.#topics) {
      if (this.#topics[m]) {
        remove(this.#topics[m], (item) => item.token === token);
      }
    }
  }
}
