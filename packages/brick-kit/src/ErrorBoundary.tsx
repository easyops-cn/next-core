import React from "react";
import {
  withTranslation,
  WithTranslation,
  // `WithTranslationProps` is required for api-extractor.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  WithTranslationProps,
} from "react-i18next";
import { httpErrorToString } from "./handleHttpError";
import { NS_BRICK_KIT, K } from "./i18n/constants";

interface ErrorBoundaryState {
  error: any;
}

// Ref https://reactjs.org/docs/error-boundaries.html
class LegacyErrorBoundary extends React.Component<
  WithTranslation,
  ErrorBoundaryState
> {
  constructor(props: WithTranslation) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { error };
  }

  /* componentDidCatch(error, info) {
    // You can also log the error to an error reporting service
    logErrorToMyService(error, info);
  } */

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
export const ErrorBoundary = withTranslation(NS_BRICK_KIT)(LegacyErrorBoundary);
