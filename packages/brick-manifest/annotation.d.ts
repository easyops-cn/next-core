export type Declaration =
  | DeclarationInterface
  | DeclarationTypeAlias
  | DeclarationEnum;

export type Annotation =
  | AnnotationEnumMember
  | AnnotationReference
  | AnnotationQualifiedName
  | AnnotationUnion
  | AnnotationArray
  | AnnotationTuple
  | AnnotationNamedTupleMember
  | AnnotationIntersection
  | AnnotationTypeLiteral
  | AnnotationPropertySignature
  | AnnotationMethodSignature
  | AnnotationIndexSignature
  | AnnotationIndexedAccess
  | AnnotationTypeParameterDeclaration
  | AnnotationTypeParameterInstantiation
  | AnnotationTypeParameter
  | AnnotationTypeOperator
  | AnnotationTypeQuery
  | AnnotationExpressionWithTypeArguments
  | AnnotationIdentifier
  | AnnotationRestElement
  | AnnotationFunctionType
  | AnnotationParenthesizedType
  | AnnotationConditionalType
  | AnnotationInferType
  | AnnotationJsLiteral
  | AnnotationKeyword
  | AnnotationUnsupported;

type AnnotationSignature =
  | AnnotationPropertySignature
  | AnnotationMethodSignature
  | AnnotationIndexSignature;

export interface DeclarationInterface {
  type: "interface";
  name: string;
  typeParameters?: AnnotationTypeParameterDeclaration;
  body: AnnotationSignature[];
  extends?: AnnotationExpressionWithTypeArguments[];
  description?: string;
  deprecated?: boolean | string;
}

export interface DeclarationTypeAlias {
  type: "typeAlias";
  name: string;
  typeParameters?: AnnotationTypeParameterDeclaration;
  annotation: Annotation;
  description?: string;
  deprecated?: boolean | string;
}

export interface DeclarationEnum {
  type: "enum";
  name: string;
  members: AnnotationEnumMember[];
  description?: string;
  deprecated?: boolean | string;
}

export interface AnnotationEnumMember {
  type: "enumMember";
  id: Annotation;
  initializer: Annotation;
}

export interface AnnotationReference {
  type: "reference";
  typeName: Annotation;
  typeParameters?: AnnotationTypeParameterInstantiation;
}

export interface AnnotationQualifiedName {
  type: "qualifiedName";
  left: Annotation;
  right: Annotation;
}

export interface AnnotationUnion {
  type: "union";
  types: Annotation[];
}

export interface AnnotationArray {
  type: "array";
  elementType: Annotation;
}

export interface AnnotationTuple {
  type: "tuple";
  elementTypes: Annotation[];
}

export interface AnnotationNamedTupleMember {
  type: "namedTupleMember";
  label: string;
  optional?: boolean;
  elementType: Annotation;
}

export interface AnnotationIntersection {
  type: "intersection";
  types: Annotation[];
}

export interface AnnotationTypeLiteral {
  type: "typeLiteral";
  members: Annotation[];
}

export interface AnnotationPropertySignature {
  type: "propertySignature";
  key: Annotation;
  annotation?: Annotation;
  optional?: boolean;
  computed?: boolean;
  readonly?: boolean;
  kind?: "get" | "set";
  description?: string;
  deprecated?: boolean | string;
}

export interface AnnotationMethodSignature {
  type: "methodSignature";
  key: Annotation;
  typeParameters?: AnnotationTypeParameterDeclaration;
  parameters: Annotation[];
  annotation?: Annotation;
  optional?: boolean;
  computed?: boolean;
  readonly?: boolean;
  kind?: "method" | "get" | "set";
  description?: string;
  deprecated?: boolean | string;
}

export interface AnnotationIndexSignature {
  type: "indexSignature";
  parameter: Annotation;
  annotation?: Annotation;
  description?: string;
  deprecated?: boolean | string;
}

export interface AnnotationIndexedAccess {
  type: "indexedAccess";
  objectType: Annotation;
  indexType: Annotation;
}

export interface AnnotationTypeParameterDeclaration {
  type: "typeParameterDeclaration";
  params: AnnotationTypeParameter[];
}

export interface AnnotationTypeParameterInstantiation {
  type: "typeParameterInstantiation";
  params: Annotation[];
}

export interface AnnotationTypeParameter {
  type: "typeParameter";
  name: string;
  default: Annotation;
  constraint: Annotation;
}

export interface AnnotationTypeOperator {
  type: "typeOperator";
  operator: string;
  annotation: Annotation;
}

export interface AnnotationTypeQuery {
  type: "typeQuery";
  exprName: Annotation;
  typeParameters?: AnnotationTypeParameterInstantiation;
}

export interface AnnotationExpressionWithTypeArguments {
  type: "expressionWithTypeArguments";
  expression: Annotation;
  typeParameters?: AnnotationTypeParameterInstantiation;
}

export interface AnnotationIdentifier {
  type: "identifier";
  name: string;
  annotation?: Annotation;
}

export interface AnnotationRestElement {
  type: "restElement";
  argument: Annotation;
  annotation?: Annotation;
}

export interface AnnotationFunctionType {
  type: "function";
  typeParameters?: AnnotationTypeParameterDeclaration;
  parameters: Annotation[];
  annotation?: Annotation;
}

export interface AnnotationParenthesizedType {
  type: "parenthesizedType";
  annotation: Annotation;
}

export interface AnnotationConditionalType {
  type: "conditionalType";
  checkType: Annotation;
  extendsType: Annotation;
  trueType: Annotation;
  falseType: Annotation;
}

export interface AnnotationInferType {
  type: "inferType";
  typeParameter: AnnotationTypeParameter;
}

export interface AnnotationJsLiteral {
  type: "jsLiteral";
  value: string | number | boolean | null;
}

export interface AnnotationKeyword {
  type: "keyword";
  value: string;
}

export interface AnnotationUnsupported {
  type: "unsupported";
  source: string;
}
