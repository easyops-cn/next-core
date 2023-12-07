import { uniqueId } from "lodash";
import { StoryboardContextWrapper } from "../StoryboardContext";

const FormContextMap = new Map<string, CustomFormContext>();

export class CustomFormContext {
  readonly formState: StoryboardContextWrapper;
  readonly id = uniqueId("form-ctx-");

  constructor(renderId?: string) {
    FormContextMap.set(this.id, this);
    this.formState = new StoryboardContextWrapper(undefined, this.id, renderId);
  }
}

export function getCustomFormContext(formContextId: string): CustomFormContext {
  return FormContextMap.get(formContextId);
}
