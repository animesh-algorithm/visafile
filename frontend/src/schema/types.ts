export type JsonSchema = {
  $ref?: string;
  type?: string | string[];
  title?: string;
  description?: string;
  enum?: Array<string | number | boolean>;
  const?: unknown;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  additionalProperties?: boolean | JsonSchema;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  pattern?: string;
  format?: string;
  default?: unknown;
  if?: JsonSchema;
  then?: JsonSchema;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
  $defs?: Record<string, JsonSchema>;
  definitions?: Record<string, JsonSchema>;
};

export type ResolvedSchema = JsonSchema & { __name?: string };
