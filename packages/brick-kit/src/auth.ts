import { AuthInfo } from "@easyops/brick-types";

const auth: AuthInfo = {};

export function authenticate(newAuth: AuthInfo): void {
  Object.assign(auth, {
    username: newAuth.username,
    userInstanceId: newAuth.userInstanceId,
  });
}

export function getAuth(): AuthInfo {
  return {
    ...auth,
  };
}

export function logout(): void {
  auth.username = undefined;
  auth.userInstanceId = undefined;
}

export function isLoggedIn(): boolean {
  return auth.username !== undefined;
}
