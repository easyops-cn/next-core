import { uniqueId } from "lodash";
import { RuntimeBrick } from "../BrickNode";
import { StoryboardContextWrapper } from "../StoryboardContext";

const FormContextMap = new Map<string, CustomFormContext>();

export class CustomFormContext {
  readonly formState: StoryboardContextWrapper;
  readonly id = uniqueId("form-ctx-");

  constructor() {
    FormContextMap.set(this.id, this);
    this.formState = new StoryboardContextWrapper("", this.id);
  }
}

export function getCustomFormContext(formContextId: string): CustomFormContext {
  return FormContextMap.get(formContextId);
}
