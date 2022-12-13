export async function loadCheckLogin(): Promise<void> {
  if (!window.NO_AUTH_GUARD) {
    throw new Error("Require `NO_AUTH_GUARD`");
  }
}
