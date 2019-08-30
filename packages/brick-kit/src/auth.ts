import { AuthInfo } from "@easyops/brick-types";

const auth: AuthInfo = {};

export function authenticate(newAuth: AuthInfo): void {
  Object.assign(auth, {
    username: newAuth.username
  });
}

export function getAuth(): AuthInfo {
  return {
    ...auth
  };
}

export function logout(): void {
  auth.username = undefined;
}

export function isLoggedIn(): boolean {
  return auth.username !== undefined;
}
