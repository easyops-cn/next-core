import React from "react";
import {
  EditorComponentProps,
  EditorContainer,
  EditorElementFactory,
  EditorSelfLayout,
  useBuilderNode,
} from "@easyops/editor-bricks-helper";
import styles from "./$kebab-brick-last-name$.editor.module.css";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface $PascalBrickName$Properties {
  // someProps?: string;
}

export function $PascalBrickName$Editor({
  nodeUid,
  brick,
}: EditorComponentProps): React.ReactElement {
  const node = useBuilderNode<$PascalBrickName$Properties>({ nodeUid });
  /**
   * 提示：使用构件的属性配置来呈现该构件的关键 UI 特征。
   * 例如：对于按钮构件，根据 `buttonType` 来显示对应的背景色。
   */
  // const { someProps } = node.parsedProperties;
  return (
    <EditorContainer nodeUid={nodeUid} brick={brick}>
      <div className={styles.wrapper}>{node.alias}</div>
    </EditorContainer>
  );
}

customElements.define(
  "$kebab-brick-name$--editor",
  EditorElementFactory($PascalBrickName$Editor, {
    selfLayout: EditorSelfLayout.INLINE,
  })
);
