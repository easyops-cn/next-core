interface VariableParams {
  appId: string;
  version: string;
}

export function setAppVariable(params: VariableParams): void {
  const { appId, version } = params;
  if (window.APP_ROOT_TPL) {
    window.APP_ID = appId;
    window.APP_ROOT = window.APP_ROOT_TPL.replace("{id}", appId).replace(
      "{version}",
      version
    );
  }
}
