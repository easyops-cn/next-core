// istanbul ignore file temporary
import {
  ReflectionKind,
  DeclarationReflection,
} from "typedoc/dist/lib/models/reflections/index";
import {
  Component,
  ConverterComponent,
} from "typedoc/dist/lib/converter/components";
import { Converter } from "typedoc/dist/lib/converter/converter";
import { Context } from "typedoc/dist/lib/converter/context";
import { ALLOW_INHERIT_OPTIONS } from "./constants";

@Component({ name: "filter-inherit" })
export class FilterInheritPlugin extends ConverterComponent {
  private allowInheritedList: string[];

  private inheritedReflections: DeclarationReflection[];

  /**
   * Create a new FilterInheritPlugin instance.
   */
  initialize() {
    this.listenTo(this.owner, Converter.EVENT_BEGIN, this.onBegin);
    this.listenTo(
      this.owner,
      Converter.EVENT_CREATE_DECLARATION,
      this.onDeclaration,
      -100
    ); // after CommentPlugin
    this.listenTo(
      this.owner,
      Converter.EVENT_RESOLVE_BEGIN,
      this.onBeginResolve
    );
  }

  onBegin() {
    const options = this.application.options.getRawValues();
    this.allowInheritedList = options[ALLOW_INHERIT_OPTIONS] || [];
    this.inheritedReflections = [];
  }

  /**
   * Triggered when the converter has created a declaration or signature reflection.
   *
   * the list of reflections that are inherited that could end up being removed.
   *
   * @param context  The context object describing the current state the converter is in.
   * @param reflection  The reflection that is currently processed.
   * @param node  The node that is currently processed if available.
   */
  private onDeclaration(
    context: Context,
    reflection: DeclarationReflection,
    node?
  ) {
    if (
      reflection.inheritedFrom &&
      reflection.parent &&
      reflection.parent.kindOf(ReflectionKind.ClassOrInterface) &&
      (!reflection.overwrites ||
        (reflection.overwrites &&
          reflection.overwrites !== reflection.inheritedFrom))
    ) {
      this.inheritedReflections.push(reflection);
    }
  }

  /**
   * Triggered when the converter begins resolving a project.
   *
   * Goes over the list of inherited reflections and removes any according to white list
   *
   * @param context The context object describing the current state the converter is in.
   */
  private onBeginResolve(context: Context) {
    this.inheritedReflections.forEach((refletion: any) => {
      const project = context.project;
      const result = refletion.inheritedFrom?.name.match(/(\w+)\.(\w+)/);
      if (!result || (result && !this.allowInheritedList.includes(result[1]))) {
        project.removeReflection(refletion);
      }
    });
  }
}
