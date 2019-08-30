import "whatwg-fetch";

let returnValue;

export const fetch = jest.fn(
  () => returnValue || Promise.resolve(new Response("{}"))
);
export const __setReturnValue = (value: any): void => {
  returnValue = value;
};
