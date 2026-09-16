import { Fragment } from "react";
import type { Field } from "@/schemas/inputs.schema";
import type { ChangeProp } from "../propConfig";
import { renderSpecificEditor, type Specific } from "../specificEditors";
import { SectionTitle } from "./SectionTitle";

export function SpecificsSection({
  specifics,
  props,
  onChangeProp,
  fieldId,
  fieldType,
}: {
  specifics: Specific[];
  props: Record<string, unknown>;
  onChangeProp: ChangeProp;
  fieldId: string;
  fieldType: Field["type"];
}) {
  if (specifics.length === 0) return null;
  return (
    <section className="space-y-2">
      <SectionTitle>Específicas do Input</SectionTitle>
      {specifics.map((specific) => (
        <Fragment key={specific.key}>
          {renderSpecificEditor(specific, {
            key: specific.key,
            value: props[specific.key],
            onChange: (v) => onChangeProp(specific.key, v),
            fieldId,
            fieldType,
          })}
        </Fragment>
      ))}
    </section>
  );
}
