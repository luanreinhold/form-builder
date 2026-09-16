import { StringEditor } from "../editors/StringEditor";
import { type ChangeProp, STRING_SECTIONS } from "../propConfig";
import { SectionTitle } from "./SectionTitle";

export function StringSections({
  props,
  onChangeProp,
}: {
  props: Record<string, unknown>;
  onChangeProp: ChangeProp;
}) {
  return (
    <>
      {STRING_SECTIONS.map((section) => (
        <section key={section.title} className="space-y-2">
          <SectionTitle>{section.title}</SectionTitle>
          {section.fields.map(({ key, label, required }) => {
            const value = (props[key] as string) ?? "";
            return (
              <StringEditor
                key={key}
                label={label}
                value={value}
                onChange={(v) => onChangeProp(key, v)}
                required={required}
                error={required && value.trim() === "" ? `${key} é obrigatório` : undefined}
              />
            );
          })}
        </section>
      ))}
    </>
  );
}
