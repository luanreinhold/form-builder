import { BooleanEditor } from "../editors/BooleanEditor";
import { StringEditor } from "../editors/StringEditor";
import { type ChangeProp, DIVIDER_STRING_PROPS } from "../propConfig";
import { SectionTitle } from "./SectionTitle";

export function DividerSection({
  props,
  onChangeProp,
}: {
  props: Record<string, unknown>;
  onChangeProp: ChangeProp;
}) {
  return (
    <section className="space-y-2">
      <SectionTitle>Divisória</SectionTitle>
      {DIVIDER_STRING_PROPS.map((key) => (
        <StringEditor
          key={key}
          label={key}
          value={(props[key] as string) ?? ""}
          onChange={(v) => onChangeProp(key, v)}
        />
      ))}
      <BooleanEditor
        label="doNotTranslate"
        value={Boolean(props.doNotTranslate)}
        onChange={(v) => onChangeProp("doNotTranslate", v)}
      />
    </section>
  );
}
