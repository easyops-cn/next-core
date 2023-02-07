interface DevtoolsHookContainer {
  __BRICK_NEXT_DEVTOOLS_HOOK__?: DevtoolsHook;
}

interface DevtoolsHook {
  emit: (message: unknown) => void;
  restoreDehydrated: (value: unknown) => unknown;
}

export function getDevHook(): DevtoolsHook | undefined {
  return (window as DevtoolsHookContainer).__BRICK_NEXT_DEVTOOLS_HOOK__;
}
