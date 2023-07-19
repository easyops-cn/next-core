// polyfill for replaceChildren
if (Element.prototype.replaceChildren === undefined) {
  Element.prototype.replaceChildren = function (...nodes: (string | Node)[]) {
    while (this.lastChild) {
      this.removeChild(this.lastChild);
    }
    if (nodes.length > 0) {
      this.append(...nodes);
    }
  };
}
