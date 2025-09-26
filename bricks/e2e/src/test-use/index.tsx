import React, { Suspense, useMemo } from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import "@next-core/theme";
import styleText from "./styles.shadow.css";

const { defineElement, property } = createDecorators();

export interface TestUseProps {
  // Define props here.
}

/**
 * 构件 `e2e.test-use`
 */
export
@defineElement("e2e.test-use", {
  styleTexts: [styleText],
})
class TestUse extends ReactNextElement implements TestUseProps {
  render() {
    return (
      <Suspense fallback={"Loading..."}>
        <TestUseComponent />
        <TestUseComponent />
      </Suspense>
    );
  }
}

function TestUseComponent(props: TestUseProps) {
  const node = useMemo(() => getInner(), []);

  return (React as any).use(node);
}

async function getInner() {
  await new Promise((resolve) => setTimeout(resolve, 100));

  return (<div>Inner</div>);
}
