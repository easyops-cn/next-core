import React from "react";
import type { AuthApi_CheckLoginResponseBody } from "@next-sdk/api-gateway-sdk";
import i18next from "i18next";
import { Modal } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import { getRuntime } from "../runtime";
import { K, NS_BRICK_KIT } from "../i18n/constants";

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
): Promise<void> {
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
): Promise<void> {
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
    // window.alert(i18next.t(`${NS_BRICK_KIT}:${payload.type === "logout" ? K.LOGOUT_APPLIED : K.LOGIN_CHANGED}`));
    Modal.warning({
      icon: <ExclamationCircleOutlined />,
      content: i18next.t(
        `${NS_BRICK_KIT}:${
          payload.type === "logout" ? K.LOGOUT_APPLIED : K.LOGIN_CHANGED
        }`
      ),
      okText: i18next.t(`${NS_BRICK_KIT}:${K.MODAL_OK}`),
      keyboard: false,
      onOk: () => {
        location.reload();
      },
    });
  }
}
