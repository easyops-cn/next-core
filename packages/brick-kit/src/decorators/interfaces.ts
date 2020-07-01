// See https://github.com/Polymer/lit-element/blob/master/src/lib/decorators.ts#L38

// From the TC39 Decorators proposal
export interface ClassElement {
  kind: "field" | "method";
  key: PropertyKey;
  placement: "static" | "prototype" | "own";
  initializer?: () => any;
  extras?: ClassElement[];
  finisher?: (Class: any) => void;
  descriptor?: PropertyDescriptor;
}
