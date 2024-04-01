import React from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import { asyncWrapBrick } from "@next-core/react-runtime";

const AsyncDep = React.lazy(async () => ({
  default: await asyncWrapBrick("e2e.async-dep"),
}));

const { defineElement } = createDecorators();

export
@defineElement("e2e.async-wrap")
class AsyncWrap extends ReactNextElement {
  render() {
    return <AsyncWrapComponent />;
  }
}

export function AsyncWrapComponent() {
  const [showDep, setShowDep] = React.useState(false);
  return (
    <>
      <h2>Async Wrapper</h2>
      {showDep ? (
        <React.Suspense fallback="Loading...">
          <AsyncDep />
        </React.Suspense>
      ) : (
        <button onClick={() => setShowDep(true)}>Show Dependency</button>
      )}
    </>
  );
}
