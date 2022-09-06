import { uniqueId } from "lodash";
import { RuntimeBrick } from "../BrickNode";
import { StoryboardContextWrapper } from "../StoryboardContext";

const FormContextMap = new Map<string, CustomFormContext>();

export class CustomFormContext {
  readonly formState: StoryboardContextWrapper;
  readonly id = uniqueId("form-ctx-");

  constructor(private brick: RuntimeBrick) {
    FormContextMap.set(this.id, this);
    this.formState = new StoryboardContextWrapper();
  }
}

export function getCustomFormContext(formContextId: string): CustomFormContext {
  return FormContextMap.get(formContextId);
}
