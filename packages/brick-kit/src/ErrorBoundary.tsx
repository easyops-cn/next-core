import React from "react";
import {
  withTranslation,
  WithTranslation,
  // `WithTranslationProps` and `Subtract` is required for api-extractor.
  WithTranslationProps,
  Subtract,
} from "react-i18next";
import { httpErrorToString } from "./handleHttpError";
import { NS_BRICK_KIT, K } from "./i18n/constants";
import { SkywalkingAnalysis } from "@next-core/easyops-analytics";
interface ErrorBoundaryState {
  error: any;
}

// Ref https://reactjs.org/docs/error-boundaries.html
class LegacyErrorBoundary extends React.Component<
  WithTranslation<typeof NS_BRICK_KIT>,
  ErrorBoundaryState
> {
  constructor(props: WithTranslation<typeof NS_BRICK_KIT>) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { error };
  }

  componentDidCatch(error: Error): void {
    SkywalkingAnalysis.reportFrameErrors(error);
  }

  render(): React.ReactNode {
    if (this.state.error) {
      // You can render any custom fallback UI
      return (
        <div data-testid="error-boundary">
          <h3>{this.props.t(K.SOMETHING_WENT_WRONG)}</h3>
          <p>{httpErrorToString(this.state.error)}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

/** @internal */
export const ErrorBoundary: React.ComponentType<
  Omit<
    Subtract<WithTranslation<typeof NS_BRICK_KIT>, WithTranslationProps>,
    keyof WithTranslation<typeof NS_BRICK_KIT>
  > &
    WithTranslationProps
> = withTranslation(NS_BRICK_KIT)(LegacyErrorBoundary);
