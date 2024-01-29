export const NS_BRICK_CONTAINER = "brick-container";

export enum K {
  BOOTSTRAP_ERROR = "BOOTSTRAP_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
}

export type Locale = { [key in K]: string };
