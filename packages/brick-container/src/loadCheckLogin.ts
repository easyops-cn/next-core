import { AuthApi_checkLogin } from "@next-api-sdk/api-gateway-sdk";
import { authenticate } from "@next-core/runtime";

export async function loadCheckLogin(): Promise<void> {
  if (!window.NO_AUTH_GUARD) {
    const auth = await AuthApi_checkLogin();
    if (auth.loggedIn) {
      authenticate(auth);
    }
  }
}
