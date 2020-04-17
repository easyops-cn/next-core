interface DevtoolsHookContainer {
  __BRICK_NEXT_DEVTOOLS_HOOK__?: DevtoolsHook;
}

interface DevtoolsHook {
  emit: (message: any) => void;
}

/* istanbul ignore next */
export function devtoolsHookEmit(type: string, payload?: any): void {
  Promise.resolve().then(() => {
    const devHook = (window as DevtoolsHookContainer)
      .__BRICK_NEXT_DEVTOOLS_HOOK__;
    devHook?.emit?.({
      type,
      payload,
    });
  });
}
