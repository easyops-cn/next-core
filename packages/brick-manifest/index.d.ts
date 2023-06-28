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
  params: MethodParamManifest[];
  returns?: {
    type?: string;
    description?: string;
  };
  deprecated?: boolean | string;
}

export interface MethodParamManifest {
  name: string;
  type?: string;
  description?: string;
  isRestElement?: boolean;
}

export interface ProviderManifest {
  type: "provider";
  name: string;
  description?: string;
  deprecated?: boolean | string;
}

export * from "./annotation.js";
