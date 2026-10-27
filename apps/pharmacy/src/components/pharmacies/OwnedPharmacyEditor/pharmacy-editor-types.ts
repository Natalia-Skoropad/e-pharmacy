import type { PharmacyEditorField } from './pharmacy-editor-fields';

//===================================================================

export type EditorErrors = Partial<
  Record<PharmacyEditorField | 'documents' | 'ownerDocuments', string>
>;

export type PharmacyDocument = {
  id: string;
  name: string;
  size: number;
  type: string;
};
