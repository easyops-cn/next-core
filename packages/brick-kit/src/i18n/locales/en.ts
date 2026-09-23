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
  [K.LICENSE_EXPIRED]:
    "The license authorization has expired, please contact the platform administrator",
  [K.LICENSE_BLOCKED]:
    "The page is not authorized, please contact the platform administrator",
  [K.NO_PERMISSION]:
    "Unauthorized access, unable to retrieve the required resources for this page",
  [K.OTHER_ERROR]: "Oops! Something went wrong",
  [K.GO_BACK_PREVIOUS_PAGE]: "Go back to previous page",
  [K.GO_BACK_HOME_PAGE]: "Back to home page",
  [K.LOGIN_CHANGED]:
    "You have logged in as another account, click OK to refresh the page.",
  [K.LOGOUT_APPLIED]:
    "Your account has been logged out, click OK to refresh the page.",
  [K.LICENSE_EXPIRES_IN_DAY]: "License expires in {{count}} day",
  [`${K.LICENSE_EXPIRES_IN_DAY}_other`]: "License expires in {{count}} days",
  // Host containers may run i18next with compatibilityJSON "v3" where plural
  // resolution only recognizes `_plural`; provide both suffixes for either engine.
  [`${K.LICENSE_EXPIRES_IN_DAY}_plural`]: "License expires in {{count}} days",
  [K.PAGE_RENDER_SLOW_TIP]:
    "Your page is running slowly. The current render time is {{renderTime}} seconds, exceeding the threshold of {{suggestTime}} seconds. Please optimize this page.",
  [K.VIEW_SUGGESTION]: "View suggestions",
};

export default locale;
