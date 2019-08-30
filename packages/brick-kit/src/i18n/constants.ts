export const NS_BRICK_KIT = "brick-kit";

export enum K {
  REQUEST_FAILED = "REQUEST_FAILED",
  MODAL_OK = "MODAL_OK",
  MODAL_CANCEL = "MODAL_CANCEL",
  SOMETHING_WENT_WRONG = "SOMETHING_WENT_WRONG"
}

export type Locale = { [key in K]: string };
