import { Info } from 'lucide-react';

import css from './DocumentUpload.module.css';

//===================================================================

export function DocumentUploadErrorNotice({
  id,
  message,
}: {
  id?: string;
  message: string;
}) {
  return (
    <p className={css.errorNotice} id={id} role="alert">
      <Info size={17} aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
