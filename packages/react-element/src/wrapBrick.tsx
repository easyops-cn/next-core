import React, {
  ForwardRefExoticComponent,
  HTMLAttributes,
  PropsWithChildren,
  ReactNode,
  Ref,
  RefAttributes,
  forwardRef,
} from "react";

interface Constructable<T> {
  prototype: T;
  new (): T;
  __tagName: string;
}

export type WrappedBrick<T, P> = ForwardRefExoticComponent<
  HTMLAttributes<T> &
    P & {
      children?: ReactNode;
    } & RefAttributes<T>
>;

export type WrappedBrickWithEventsMap<T, P, E, M> = ForwardRefExoticComponent<
  HTMLAttributes<T> &
    P & {
      children?: ReactNode;
    } & MapEvents<E, M> &
    RefAttributes<T>
>;

type MapEvents<E, M> = {
  [key in keyof M]?: M[key] extends keyof E ? (e: E[M[key]]) => void : never;
};

export function wrapLocalBrick<T extends HTMLElement, P, E, M extends object>(
  brick: Constructable<T> | string,
  eventsMapping: M
): WrappedBrickWithEventsMap<T, P, E, M>;

export function wrapLocalBrick<T extends HTMLElement, P>(
  brick: Constructable<T> | string
): WrappedBrick<T, P>;

export function wrapLocalBrick<T extends HTMLElement, P, E, M extends object>(
  brick: Constructable<T> | string,
  eventsMapping?: M
) {
  // istanbul ignore next
  if (process.env.NODE_ENV === "development") {
    if (typeof brick === "string" && !customElements.get(brick)) {
      throw new Error(
        `Brick ${brick} is not defined while using \`wrapLocalBrick\`.`
      );
    }
  }
  return forwardRef(function BrickReactWrapper(
    {
      children,
      ...props
    }: HTMLAttributes<T> & PropsWithChildren<P> & MapEvents<E, M>,
    ref: Ref<T>
  ) {
    const WebComponent = typeof brick === "string" ? brick : brick.__tagName;
    const properties = getMappedProperties(
      props,
      eventsMapping as Record<string, string>
    ) as any;
    return (
      <WebComponent {...properties} ref={ref}>
        {children}
      </WebComponent>
    );
  });
}

export function wrapBrick<T extends HTMLElement, P, E, M extends object>(
  BrickName: string,
  eventsMapping: M
): WrappedBrickWithEventsMap<T, P, E, M>;

export function wrapBrick<T extends HTMLElement, P>(
  BrickName: string
): WrappedBrick<T, P>;

export function wrapBrick<T extends HTMLElement, P, E, M extends object>(
  BrickName: string,
  eventsMapping?: M
) {
  return forwardRef(function BrickReactWrapper(
    {
      children,
      ...props
    }: HTMLAttributes<T> & PropsWithChildren<P> & MapEvents<E, M>,
    ref: Ref<T>
  ) {
    const properties = getMappedProperties(
      props,
      eventsMapping as Record<string, string>
    ) as any;
    return (
      <BrickName {...properties} ref={ref}>
        {children}
      </BrickName>
    );
  });
}

function getMappedProperties(
  props: Record<string, unknown>,
  eventsMapping?: Record<string, string>
) {
  let properties: Record<string, unknown>;
  if (eventsMapping) {
    properties = {};
    for (const [propName, propValue] of Object.entries(props)) {
      if (Object.prototype.hasOwnProperty.call(eventsMapping, propName)) {
        properties[`on${eventsMapping[propName]}`] = propValue;
      } else {
        properties[propName] = propValue;
      }
    }
  } else {
    properties = props;
  }
  return properties;
}
