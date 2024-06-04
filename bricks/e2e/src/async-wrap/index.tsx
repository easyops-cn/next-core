import React, { Suspense, lazy, useMemo, useState } from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import { asyncWrapBrick } from "@next-core/react-runtime";

const { defineElement } = createDecorators();

export
@defineElement("e2e.async-wrap")
class AsyncWrap extends ReactNextElement {
  render() {
    return <AsyncWrapComponent />;
  }
}

export function AsyncWrapComponent() {
  const [dep, setDep] = useState("");

  const DepComponent = useMemo(() => {
    if (dep) {
      return lazy(async () => ({
        default: await asyncWrapBrick(dep),
      }));
    }
    return null;
  }, [dep]);

  return (
    <>
      <h2>Async Wrapper</h2>
      <p>
        <select defaultValue="" onChange={(e) => setDep(e.target.value)}>
          <option value="">Dep: none</option>
          <option value="e2e.async-dep">Dep: async-dep</option>
          <option value="e2e.async-dep-alt">Dep: async-dep-alt</option>
        </select>
      </p>
      <Suspense fallback="Loading...">
        {DepComponent && <DepComponent />}
      </Suspense>
    </>
  );
}
