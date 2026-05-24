import type { ReactNode } from 'react';

import css from './AuthField.module.css';

//===================================================================

type AuthFieldsGroupProps = {
  children: ReactNode;
};

//===================================================================

function AuthFieldsGroup({ children }: AuthFieldsGroupProps) {
  return <div className={css.fields}>{children}</div>;
}

export default AuthFieldsGroup;
