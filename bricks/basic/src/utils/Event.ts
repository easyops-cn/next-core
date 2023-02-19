export class Event {
  #topics: Record<string, any> = {};
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
        for (let i = 0, j = this.#topics[m].length; i < j; i++) {
          if (this.#topics[m][i].token === token) {
            this.#topics[m].splice(i, 1);
          }
        }
      }
    }
  }
}
