export type ClassFieldDecorator = (
  value: undefined,
  context: ClassFieldDecoratorContext
) => (initialValue: unknown) => unknown | void;

export interface ClassFieldDecoratorContext {
  kind: "field";
  name: string | symbol;
  access: { get(): unknown; set(value: unknown): void };
  static: boolean;
  private: boolean;
}

export type ClassDecorator = (
  value: Function,
  context: ClassDecoratorContext
) => Function | void;

export interface ClassDecoratorContext {
  kind: "class";
  name: string | undefined;
  addInitializer(initializer: () => void): void;
}
