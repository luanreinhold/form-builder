import { BooleanEditor } from "../editors/BooleanEditor";
import { BASE_BOOLEAN_PROPS, type ChangeProp } from "../propConfig";
import { SectionTitle } from "./SectionTitle";

export function BehaviorSection({
  props,
  onChangeProp,
}: {
  props: Record<string, unknown>;
  onChangeProp: ChangeProp;
}) {
  return (
    <section className="space-y-2">
      <SectionTitle>Comportamento</SectionTitle>
      {BASE_BOOLEAN_PROPS.map((key) => (
        <BooleanEditor
          key={key}
          label={key}
          value={Boolean(props[key])}
          onChange={(v) => onChangeProp(key, v)}
        />
      ))}
    </section>
  );
}
