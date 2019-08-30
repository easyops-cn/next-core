import { RuntimeBrick } from "../BrickNode";

export class BrickNode {
  private children;
  constructor(private brick: RuntimeBrick) {}

  mount(): HTMLElement {
    return document.createElement(this.brick.type);
  }

  unmount(): void {}
}
