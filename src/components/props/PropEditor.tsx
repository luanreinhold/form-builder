import { listSpecificProps } from "./listSpecificProps";
import type { PropEditorProps } from "./propConfig";
import {
  BehaviorSection,
  DividerSection,
  EditorHeader,
  SpecificsSection,
  StringSections,
  WrapperSection,
} from "./sections";

export function PropEditor({ field, onChangeProp, onChangeMeta, onDelete }: PropEditorProps) {
  const props = field.props as Record<string, unknown>;

  // divider nao e um input na v3 (estende BaseComponent): as secoes de
  // Identificacao/Comportamento nao se aplicam — so as props do divider.
  if (field.type === "divider-component") {
    return (
      <div className="space-y-4">
        <EditorHeader type={field.type} onDelete={onDelete} />
        <WrapperSection field={field} onChangeMeta={onChangeMeta} />
        <DividerSection props={props} onChangeProp={onChangeProp} />
      </div>
    );
  }

  const specifics = listSpecificProps(field);

  return (
    <div className="space-y-4">
      <EditorHeader type={field.type} onDelete={onDelete} />
      <StringSections props={props} onChangeProp={onChangeProp} />
      <WrapperSection field={field} onChangeMeta={onChangeMeta} />
      <BehaviorSection props={props} onChangeProp={onChangeProp} />
      <SpecificsSection
        specifics={specifics}
        props={props}
        onChangeProp={onChangeProp}
        fieldId={field.id}
        fieldType={field.type}
      />
    </div>
  );
}
