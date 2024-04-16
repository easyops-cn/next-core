import type { AuthApi_CheckLoginResponseBody } from "@next-api-sdk/api-gateway-sdk";
import { i18n } from "@next-core/i18n";
import { Dialog, getRuntime } from "@next-core/runtime";
import { K, NS } from "./i18n";

const REFRESH_CHANNEL = "brick-next:authentication-change";
let warnedToRefresh = false;

interface AuthPayload {
  org?: number;
  username?: string;
}

interface LoginChangePayload extends AuthPayload {
  type: "logout" | "check-login";
}

export async function refreshPageIfAuthenticationChanged(
  auth: AuthApi_CheckLoginResponseBody
) {
  if (window.BroadcastChannel) {
    const channel = new BroadcastChannel(REFRESH_CHANNEL);
    channel.postMessage({
      type: "check-login",
      org: auth.org,
      username: auth.username,
    });
    channel.addEventListener("message", (e) => {
      handleAuthenticationChange(e.data, auth);
    });
  } else {
    const PolyfillChannel = (await import("broadcast-channel"))
      .BroadcastChannel;
    const channel = new PolyfillChannel<LoginChangePayload>(REFRESH_CHANNEL);
    channel.postMessage({
      type: "check-login",
      org: auth.org,
      username: auth.username,
    });
    // The npm package `broadcast-channel` dispatch message as raw data instead of a MessageEvent.
    channel.addEventListener("message", (data) => {
      handleAuthenticationChange(data, auth);
    });
  }
}

async function handleAuthenticationChange(
  payload: LoginChangePayload,
  auth: AuthPayload
) {
  if (
    !warnedToRefresh &&
    (payload.type === "logout" ||
      (payload.type === "check-login" &&
        (payload.org !== auth.org || payload.username !== auth.username))) &&
    getRuntime().getFeatureFlags()["refresh-page-if-authentication-changed"]
  ) {
    // Only warn the user once.
    warnedToRefresh = true;
    // Open a modal to ask the user to refresh the page.
    await Dialog.show({
      type: "warn",
      content: i18n.t(
        `${NS}:${payload.type === "logout" ? K.LOGOUT_APPLIED : K.LOGIN_CHANGED}`
      ),
    });
    window.location.reload();
  }
}
