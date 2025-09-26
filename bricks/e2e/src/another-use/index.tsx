import React, { Suspense, useMemo } from "react";
import { createDecorators } from "@next-core/element";
import { ReactNextElement } from "@next-core/react-element";
import "@next-core/theme";
import styleText from "./styles.shadow.css";

const { defineElement, property } = createDecorators();

export interface AnotherUseProps {
  // Define props here.
}

/**
 * 构件 `e2e.another-use`
 */
export
@defineElement("e2e.another-use", {
  styleTexts: [styleText],
})
class AnotherUse extends ReactNextElement implements AnotherUseProps {
  render() {
    return (
      <Suspense fallback={"Loading..."}>
        <AnotherUseComponent />
      </Suspense>
    );
  }
}

function AnotherUseComponent(props: AnotherUseProps) {
  const node = useMemo(() => getInner(), []);

  return (React as any).use(node);
}

async function getInner() {
  await new Promise((resolve) => setTimeout(resolve, 123));

  return (<div>Inner</div>);
}
