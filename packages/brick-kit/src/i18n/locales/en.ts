import { Locale, K } from "../constants";

const locale: Locale = {
  [K.REQUEST_FAILED]: "Request Failed",
  [K.MODAL_OK]: "Ok",
  [K.MODAL_CANCEL]: "Cancel",
  [K.SOMETHING_WENT_WRONG]: "Something went wrong!",
  [K.LOGIN_TIMEOUT_MESSAGE]:
    "You haven't logged in or your login session has expired. Login right now?",
  [K.NETWORK_ERROR]: "Network error, please check your network.",
  [K.PAGE_NOT_FOUND]: "Page not found, please check the URL",
  [K.APP_NOT_FOUND]:
    "App not found, maybe the URL is wrong or you don't have permission to access",
};

export default locale;
