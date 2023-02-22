import { AuthApi_checkLogin } from "@next-api-sdk/api-gateway-sdk";
import { authenticate } from "../auth.js";

export async function loadCheckLogin(): Promise<void> {
  if (!window.NO_AUTH_GUARD) {
    const auth = await AuthApi_checkLogin();
    if (auth.loggedIn) {
      authenticate(auth);
    }
  }
}
