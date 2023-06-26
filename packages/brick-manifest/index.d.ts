export interface PackageManifest {
  manifest_version: number;
  package: string;
  name: string;
  bricks: BrickManifest[];
  providers?: ProviderManifest[];
}

export interface BrickManifest {
  name: string;
  description?: string;
  properties: PropertyManifest[];
  slots: SlotManifest[];
  events: EventManifest[];
  methods: MethodManifest[];
  deprecated?: boolean | string;
}

export interface PropertyManifest {
  name: string;
  description?: string;
  attribute?: string | boolean;
  type?: string;
  default?: string;
  required?: boolean;
  deprecated?: boolean | string;
}

export interface SlotManifest {
  name: string | null;
  description?: string;
  deprecated?: boolean | string;
}

export interface EventManifest {
  name: string;
  description?: string;
  detail?: {
    type?: string;
    description?: string;
  };
  deprecated?: boolean | string;
}

export interface MethodManifest {
  name: string;
  description?: string;
  params: unknown[];
  return?: {
    type?: string;
    description?: string;
  };
  deprecated?: boolean | string;
}

export interface ProviderManifest {
  name: string;
  description?: string;
  deprecated?: boolean | string;
}

export type Annotation =
  | InterfaceDeclaration
  | TypeAliasDeclaration
  | EnumDeclaration
  | PropertySignature
  | IndexSignature
  | Union
  | Tuple
  | ArrayType
  | Intersection
  | TypeLiteral
  | IndexedAccess
  | Reference
  | TypeParameterDeclaration
  | TypeParameter
  | Qualified
  | Literal
  | Identifer
  | Keyword
  | StringLiteral;

export interface Base {
  description?: string;
  required?: boolean;
  tags?: string[];
}

export interface PropertySignature extends Base {
  type: "propertySignature";
  name: string;
  property: Annotation;
}

export interface IndexSignature extends Base {
  type: "indexSignature";
  parameters?: Annotation & { name: string };
  property: Annotation;
}

export interface TypeParameters extends Base {
  type: "typeParameterDeclaration";
  params: TypeParameter[];
}

export interface TypeParameter extends Base {
  type: "typeParameter";
  value: string;
  default: Annotation;
}

export interface Member extends Base {
  name: Annotation;
  value?: Annotation;
}

export interface Reference extends Base {
  type: "reference";
  typeName?: string;
  typeParameters?: TypeParameter[];
  qualified?: Qualified;
}

export interface Qualified extends Base {
  type: "qualifiedName";
  left: Annotation;
  right: Annotation;
}

export interface Union extends Base {
  type: "union";
  types: Annotation[];
}

export interface ArrayType extends Base {
  type: "array";
  elementType: Annotation;
}

export interface Tuple extends Base {
  type: "tuple";
  elementTypes: Annotation[];
}

export interface Intersection extends Base {
  type: "intersection";
  types: Annotation[];
}

export interface TypeLiteral extends Base {
  type: "typeLiteral";
  members: Annotation[];
}

export interface IndexedAccess extends Base {
  type: "indexedAccess";
  objectType: Annotation;
  indexType: Annotation;
}

export interface TypeParameterDeclaration extends Base {
  type: "typeParameterDeclaration";
  params: TypeParameter[];
}

export interface Literal extends Base {
  type: "literal";
  value: string | number | boolean | undefined | null;
}

export interface Identifer extends Base {
  type: "identifier";
  value: string;
  name?: string;
}

export interface StringLiteral extends Base {
  type: "stringLiteral";
  value: string;
  name?: string;
}

export interface Keyword extends Base {
  type: "keyword";
  value: string;
  name?: string;
}

export interface InterfaceDeclaration extends Base {
  name: string;
  type: "interface";
  annotation: Annotation[];
  typeParameters?: TypeParameters;
}

export interface TypeAliasDeclaration extends Base {
  name: string;
  type: "typeAlias";
  annotation: Annotation | Annotation[];
  typeParameters?: TypeParameters;
}

export interface EnumDeclaration extends Base {
  name: string;
  type: "enums";
  members: Member[];
}

export type Types =
  | InterfaceDeclaration
  | TypeAliasDeclaration
  | EnumDeclaration;
