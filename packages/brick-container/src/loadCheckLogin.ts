import { AuthApi_checkLogin } from "@next-api-sdk/api-gateway-sdk";
import { auth } from "@next-core/easyops-runtime";

export async function loadCheckLogin(): Promise<void> {
  if (!window.NO_AUTH_GUARD) {
    const result = await AuthApi_checkLogin();
    if (result.loggedIn) {
      auth.authenticate(result);
    }
  }
}
