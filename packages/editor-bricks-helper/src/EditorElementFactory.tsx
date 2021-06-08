/* istanbul-ignore-file */
// Todo(steve): Ignore tests temporarily for potential breaking change in the future.
import React from "react";
import ReactDOM from "react-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { UpdatingElement, property, BrickWrapper } from "@next-core/brick-kit";
import { StoryDoc } from "@next-core/brick-types";
import { EditorSelfLayout } from "./interfaces";
import { BuilderProvider } from "./BuilderProvider";

export interface EditorComponentProps {
  nodeUid: number;
  editorProps?: StoryDoc["editorProps"];
}

export type EditorComponentType = React.FunctionComponent<EditorComponentProps>;

export interface EditorBrickElement extends HTMLElement {
  nodeUid: number;
}

export interface EditorBrickElementConstructor {
  new (): EditorBrickElement;
  readonly selfLayout: EditorSelfLayout;
}

export interface EditorElementOptions {
  brickStyle?: Record<string, string>;
  selfLayout?: EditorSelfLayout;
}

export function EditorElementFactory(
  EditorComponent: EditorComponentType,
  options?: EditorElementOptions
): EditorBrickElementConstructor {
  class NewEditorElement extends UpdatingElement {
    static get selfLayout(): EditorSelfLayout {
      return options?.selfLayout;
    }

    @property({ type: Number })
    nodeUid: number;

    @property({ attribute: false })
    editorProps: StoryDoc["editorProps"];

    connectedCallback(): void {
      // Don't override user's style settings.
      // istanbul ignore else
      if (!this.style.display) {
        this.style.display = "block";
      }
      if (options?.brickStyle) {
        for (const [key, value] of Object.entries(options.brickStyle)) {
          (this.style as unknown as Record<string, string>)[key] = value;
        }
      }
      this._render();
    }

    disconnectedCallback(): void {
      ReactDOM.unmountComponentAtNode(this);
    }

    protected _render(): void {
      // istanbul ignore else
      if (this.isConnected && this.nodeUid) {
        ReactDOM.render(
          <BrickWrapper>
            <BuilderProvider>
              <DndProvider backend={HTML5Backend}>
                <EditorComponent
                  nodeUid={this.nodeUid}
                  editorProps={this.editorProps}
                />
              </DndProvider>
            </BuilderProvider>
          </BrickWrapper>,
          this
        );
      }
    }
  }
  return NewEditorElement;
}
