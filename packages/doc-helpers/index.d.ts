import { PackageManifest } from "@next-core/brick-manifest";

export interface Example {
  key: string;
  mode: "html" | "yaml";
  html: string;
  yaml: string;
}

export function getExamples(bricksDir: string): Promise<Example[]>;

export interface MarkdownExample {
  name: string;
  heading: string;
  mode: "html" | "yaml";
  meta?: string;
  code: string;
  codeIndex: number;
}

export function extractExamplesInMarkdown(
  markdown: string,
  name: string
): MarkdownExample[];

export function htmlToYaml(html: string, manifests: PackageManifest[]): string;

export function yamlToHtml(yaml: string, manifests: PackageManifest[]): string;

export function htmlTagEntity(raw: string): string;
