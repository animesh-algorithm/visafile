import type { ReactNode } from "react";
import {
  getSectionSchema,
  isDatePartsSchema,
  resolveRef,
} from "../schema/resolve";
import { datePartsToInput, inputToDateParts } from "../schema/dates";
import type { JsonSchema, ResolvedSchema } from "../schema/types";
import type { CeacOption } from "../schema/ceac-options";
import { INTERVIEW_LOCATIONS, OTHER_PURPOSE, US_STATES } from "../schema/ceac-options";
import {
  countriesForField,
  friendlyHelp,
  isCountryField,
  isUsStateField,
  labelFor,
  optionsForEnum,
} from "../schema/fieldMeta";

type Props = {
  sectionKey: string;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  errors?: Record<string, string>;
  onlyPaths?: string[];
};

function FieldError({
  path,
  errors,
}: {
  path: string;
  errors?: Record<string, string>;
}) {
  const msg = errors?.[path];
  if (!msg) return null;
  return <div className="field-error">{humanError(msg)}</div>;
}

function humanError(msg: string): string {
  if (/must be equal to one of the allowed values/i.test(msg)) {
    return "Please choose a value from the list.";
  }
  if (/must have required property/i.test(msg)) {
    return "This field is required.";
  }
  if (/must match pattern|must be/i.test(msg)) {
    return "Please enter a valid value.";
  }
  if (/minLength/i.test(msg)) return "This field is required.";
  return msg;
}

function YesNoRadios({
  id,
  value,
  onChange,
  required,
}: {
  id: string;
  value: unknown;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const current = value == null ? "" : String(value);
  return (
    <div className="choice-row" role="radiogroup" aria-required={required}>
      {[
        { v: "YES", label: "Yes" },
        { v: "NO", label: "No" },
      ].map((opt) => (
        <label
          key={opt.v}
          className={`choice-chip${current === opt.v ? " selected" : ""}`}
        >
          <input
            type="radio"
            name={id}
            value={opt.v}
            checked={current === opt.v}
            onChange={() => onChange(opt.v)}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
}

function OptionSelect({
  id,
  options,
  value,
  onChange,
  required,
  placeholder = "Choose…",
}: {
  id: string;
  options: CeacOption[];
  value: unknown;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  const current = value == null ? "" : String(value);
  const known = options.some((o) => o.value === current);
  return (
    <select
      id={id}
      value={known ? current : current ? current : ""}
      required={required}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {!known && current ? (
        <option value={current}>{current} (current)</option>
      ) : null}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function EnumSelect({
  id,
  schema,
  value,
  onChange,
  required,
}: {
  id: string;
  schema: ResolvedSchema;
  value: unknown;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const typeName = schema.__name;
  let options = optionsForEnum(typeName, schema.enum);
  if (typeName === "PurposeOfTrip") {
    const preferred = ["B", "F", "J", "H", "L"];
    options = [
      ...preferred
        .map((v) => options.find((o) => o.value === v))
        .filter((o): o is CeacOption => Boolean(o)),
      ...options.filter((o) => !preferred.includes(o.value)),
    ];
  }
  return (
    <OptionSelect
      id={id}
      options={options}
      value={value}
      required={required}
      onChange={onChange}
      placeholder={required ? "Choose…" : "—"}
    />
  );
}

function SchemaField({
  name,
  schema,
  value,
  onChange,
  path,
  required,
  errors,
}: {
  name: string;
  schema: JsonSchema;
  value: unknown;
  onChange: (v: unknown) => void;
  path: string;
  required?: boolean;
  errors?: Record<string, string>;
}) {
  const resolved = resolveRef(schema);
  const id = `field-${path.replace(/\./g, "-")}`;
  const label = labelFor(name, resolved.title);
  const help = friendlyHelp(resolved.description, name);
  const typeName = resolved.__name;
  const compact =
    resolved.type === "boolean" ||
    typeName === "YesNo" ||
    (resolved.enum && (resolved.enum?.length ?? 0) <= 4);

  const wrap = (body: ReactNode, className = "") => (
    <div
      className={`field${compact ? " field-compact" : ""}${className ? ` ${className}` : ""}`}
    >
      {resolved.type === "boolean" ? null : (
        <label htmlFor={id}>
          {label}
          {required ? <span className="req"> *</span> : null}
        </label>
      )}
      {help && <p className="field-desc">{help}</p>}
      {body}
      <FieldError path={path} errors={errors} />
    </div>
  );

  if (isDatePartsSchema(resolved)) {
    return wrap(
      <input
        id={id}
        type="date"
        value={datePartsToInput(value, resolved)}
        required={required}
        onChange={(e) => {
          const parts = inputToDateParts(e.target.value, resolved);
          onChange(parts);
        }}
      />,
    );
  }

  if (typeName === "YesNo" || (resolved.enum?.length === 2 &&
      resolved.enum.includes("YES") &&
      resolved.enum.includes("NO"))) {
    return wrap(
      <YesNoRadios
        id={id}
        value={value}
        required={required}
        onChange={onChange}
      />,
    );
  }

  if (resolved.enum) {
    return wrap(
      <EnumSelect
        id={id}
        schema={resolved}
        value={value}
        required={required}
        onChange={onChange}
      />,
    );
  }

  if (resolved.type === "boolean") {
    return (
      <div className="field field-check">
        <label htmlFor={id} className="check-card">
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span>
            <strong>{label}</strong>
            {help && <em>{help}</em>}
          </span>
        </label>
        <FieldError path={path} errors={errors} />
      </div>
    );
  }

  if (resolved.type === "array") {
    const items = Array.isArray(value) ? (value as unknown[]) : [];
    const itemSchema = resolved.items ? resolveRef(resolved.items) : null;
    return (
      <div className="field field-array">
        <div className="field-array-head">
          <label>
            {label}
            {required ? <span className="req"> *</span> : null}
          </label>
          <button
            type="button"
            className="small"
            onClick={() => {
              const empty =
                itemSchema?.type === "object" || itemSchema?.properties
                  ? {}
                  : "";
              onChange([...items, empty]);
            }}
          >
            + Add
          </button>
        </div>
        {help && <p className="field-desc">{help}</p>}
        {items.length === 0 && (
          <p className="field-empty">None added yet.</p>
        )}
        {items.map((item, index) => (
          <div key={index} className="array-item">
            <div className="array-item-title">Item {index + 1}</div>
            {itemSchema?.properties ? (
              <ObjectFields
                schema={itemSchema}
                value={(item as Record<string, unknown>) ?? {}}
                onChange={(next) => {
                  const copy = [...items];
                  copy[index] = next;
                  onChange(copy);
                }}
                path={`${path}.${index}`}
                errors={errors}
              />
            ) : (
              <input
                type="text"
                value={item == null ? "" : String(item)}
                placeholder={label}
                onChange={(e) => {
                  const copy = [...items];
                  copy[index] = e.target.value;
                  onChange(copy);
                }}
              />
            )}
            <button
              type="button"
              className="small danger"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </div>
        ))}
        <FieldError path={path} errors={errors} />
      </div>
    );
  }

  if (resolved.type === "object" || resolved.properties) {
    return (
      <fieldset className="field-group">
        <legend>
          {label}
          {required ? <span className="req"> *</span> : null}
        </legend>
        {help && <p className="field-desc">{help}</p>}
        <ObjectFields
          schema={resolved}
          value={(value as Record<string, unknown>) ?? {}}
          onChange={onChange}
          path={path}
          errors={errors}
        />
      </fieldset>
    );
  }

  if (name === "locationCode") {
    return wrap(
      <OptionSelect
        id={id}
        options={INTERVIEW_LOCATIONS}
        value={value}
        required={required}
        onChange={onChange}
        placeholder="Choose embassy / consulate…"
      />,
    );
  }

  if (name === "otherPurpose" || typeName === "OtherPurpose") {
    return wrap(
      <OptionSelect
        id={id}
        options={OTHER_PURPOSE}
        value={value}
        required={required}
        onChange={onChange}
        placeholder="Choose visa class…"
      />,
    );
  }

  if (isCountryField(name, typeName)) {
    return wrap(
      <OptionSelect
        id={id}
        options={countriesForField(name, path)}
        value={value}
        required={required}
        onChange={onChange}
        placeholder="Choose country / region…"
      />,
    );
  }

  if (isUsStateField(name, path) || typeName === "UsStateCode") {
    return wrap(
      <OptionSelect
        id={id}
        options={US_STATES}
        value={value}
        required={required}
        onChange={onChange}
        placeholder="Choose state / territory…"
      />,
    );
  }

  const inputType =
    resolved.format === "email"
      ? "email"
      : resolved.format === "uri"
        ? "url"
        : name.toLowerCase().includes("phone")
          ? "tel"
          : "text";

  const placeholder =
    name === "passportNumber" ? "As printed in passport" : undefined;

  return wrap(
    <input
      id={id}
      type={inputType}
      value={value == null ? "" : String(value)}
      required={required}
      minLength={resolved.minLength}
      maxLength={resolved.maxLength}
      pattern={resolved.pattern}
      placeholder={placeholder}
      autoComplete="on"
      onChange={(e) => onChange(e.target.value)}
    />,
  );
}

function ObjectFields({
  schema,
  value,
  onChange,
  path,
  errors,
  onlyKeys,
}: {
  schema: ResolvedSchema;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  path: string;
  errors?: Record<string, string>;
  onlyKeys?: string[];
}) {
  const props = schema.properties ?? {};
  const required = new Set(schema.required ?? []);
  const keys = onlyKeys ?? Object.keys(props);

  return (
    <div className="fields fields-grid">
      {keys.map((key) => {
        if (!props[key]) return null;
        const childPath = path ? `${path}.${key}` : key;
        return (
          <SchemaField
            key={key}
            name={key}
            schema={props[key]}
            value={value[key]}
            required={required.has(key)}
            path={childPath}
            errors={errors}
            onChange={(v) => onChange({ ...value, [key]: v })}
          />
        );
      })}
    </div>
  );
}

export function SchemaForm({
  sectionKey,
  value,
  onChange,
  errors,
  onlyPaths,
}: Props) {
  const schema = getSectionSchema(sectionKey);

  if (onlyPaths?.length) {
    const relativeKeys = [
      ...new Set(
        onlyPaths.map((p) => {
          const stripped = p.startsWith(`${sectionKey}.`)
            ? p.slice(sectionKey.length + 1)
            : p;
          return stripped.split(".")[0];
        }),
      ),
    ];
    return (
      <ObjectFields
        schema={schema}
        value={value}
        onChange={onChange}
        path={sectionKey}
        errors={errors}
        onlyKeys={relativeKeys}
      />
    );
  }

  return (
    <ObjectFields
      schema={schema}
      value={value}
      onChange={onChange}
      path={sectionKey}
      errors={errors}
    />
  );
}

export function SchemaPathField({
  schemaPath,
  rootValue,
  onChange,
  error,
}: {
  schemaPath: string;
  rootValue: Record<string, unknown>;
  onChange: (path: string, value: unknown) => void;
  error?: string;
}) {
  const parts = schemaPath.split(".");
  const sectionKey = parts[0];
  const schema = getSectionSchema(sectionKey);
  let cursor: ResolvedSchema = schema;
  for (let i = 1; i < parts.length; i++) {
    const prop = cursor.properties?.[parts[i]];
    if (!prop) {
      const leaf = parts[parts.length - 1];
      return (
        <div className="field">
          <label>{labelFor(leaf, schemaPath)}</label>
          <input
            type="text"
            value={String(
              parts.reduce<unknown>(
                (acc, key) =>
                  acc && typeof acc === "object"
                    ? (acc as Record<string, unknown>)[key]
                    : "",
                rootValue,
              ) ?? "",
            )}
            onChange={(e) => onChange(schemaPath, e.target.value)}
          />
          {error && <div className="field-error">{error}</div>}
        </div>
      );
    }
    cursor = resolveRef(prop);
  }

  const current = parts.reduce<unknown>(
    (acc, key) =>
      acc && typeof acc === "object"
        ? (acc as Record<string, unknown>)[key]
        : undefined,
    rootValue,
  );

  const leafName = parts[parts.length - 1];
  return (
    <SchemaField
      name={leafName}
      schema={cursor}
      value={current}
      path={schemaPath}
      required
      errors={error ? { [schemaPath]: error } : undefined}
      onChange={(v) => onChange(schemaPath, v)}
    />
  );
}
