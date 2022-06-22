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
  private excludesInheritedList: Map<string, Map<string, string[]>>;

  /**
   * Create a new FilterInheritPlugin instance.
   */
  initialize(): void {
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

  onBegin(): void {
    const options = this.application.options.getRawValues();
    this.allowInheritedList = options[ALLOW_INHERIT_OPTIONS] || [];
    this.inheritedReflections = [];
    this.excludesInheritedList = new Map();
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
  ): void {
    if (
      this.allowInheritedList.length &&
      reflection.inheritedFrom &&
      reflection.parent &&
      reflection.parent.kindOf(ReflectionKind.ClassOrInterface) &&
      (!reflection.overwrites ||
        (reflection.overwrites &&
          reflection.overwrites !== reflection.inheritedFrom))
    ) {
      this.inheritedReflections.push(reflection);
    }

    if (reflection.comment?.hasTag("excludesinherit")) {
      const { text } = reflection.comment.getTag("excludesinherit");
      const fields = text.trim().split(/\s+/);

      const fileName = reflection.sources?.[0]?.fileName;
      const find = this.excludesInheritedList.get(fileName);

      if (find) {
        find.set(reflection.name, fields);
      } else {
        const map = new Map();
        this.excludesInheritedList.set(fileName, map);

        map.set(reflection.name, fields);
      }
    }
  }

  /**
   * Triggered when the converter begins resolving a project.
   *
   * Goes over the list of inherited reflections and removes any according to white list
   *
   * @param context The context object describing the current state the converter is in.
   */
  private onBeginResolve(context: Context): void {
    this.inheritedReflections.forEach((reflection: any) => {
      const project = context.project;
      const result = reflection.inheritedFrom?.name.match(/(\w+)\.(\w+)/);
      if (!result || (result && !this.allowInheritedList.includes(result[1]))) {
        project.removeReflection(reflection);
      }
    });

    const all = ReflectionKind.Reference * 2 - 1;
    const reflectionList = context.project.getReflectionsByKind(all);

    reflectionList.forEach((reflection: DeclarationReflection) => {
      if (reflection.inheritedFrom && reflection.parent) {
        const fieldList =
          this.excludesInheritedList
            .get(reflection.parent?.sources?.[0]?.fileName)
            ?.get(reflection.parent.name) || [];

        if (fieldList.includes(reflection.name)) {
          context.project.removeReflection(reflection);
        }
      }
    });
  }
}
