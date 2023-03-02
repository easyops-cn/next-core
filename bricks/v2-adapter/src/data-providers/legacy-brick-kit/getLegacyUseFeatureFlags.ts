import type React from "react";
import { FeatureFlags } from "@next-core/types";

interface featureFlagsProps {
  name: string | string[];
  fallback?: React.ReactNode;
}

export function getLegacyUseFeatureFlags(LegacyReact: typeof React) {
  const FeatureFlagsContext = LegacyReact.createContext<FeatureFlags>({});
  const FeatureFlagsProvider = FeatureFlagsContext.Provider;

  function useFeatureFlags(name?: string | string[]): boolean[] | string[] {
    const featureFlags = LegacyReact.useContext(FeatureFlagsContext);
    const flagNames = ([] as (string | undefined)[])
      .concat(name)
      .filter(Boolean) as string[];
    return flagNames.length
      ? flagNames.map((flag) => !!featureFlags[flag])
      : Object.keys(featureFlags).filter((flag) => !!featureFlags[flag]);
  }

  function DisplayByFeatureFlags(
    props: React.PropsWithChildren<featureFlagsProps>
  ): React.ReactElement | null {
    const featureFlags = useFeatureFlags(props.name) as boolean[];
    return featureFlags.every((flag) => !!flag)
      ? LegacyReact.createElement(
          LegacyReact.Fragment,
          null,
          ...([] as React.ReactNode[]).concat(props.children)
        )
      : props.fallback
      ? LegacyReact.createElement(
          LegacyReact.Fragment,
          null,
          ...([] as React.ReactNode[]).concat(props.fallback)
        )
      : null;
  }

  return {
    useFeatureFlags,
    FeatureFlagsProvider,
    DisplayByFeatureFlags,
  };
}
