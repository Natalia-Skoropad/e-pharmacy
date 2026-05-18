import AuthFormShell from './AuthFormShell';
import LoginForm from './LoginForm';

import {
  LOGIN_BENEFITS,
  LOGIN_DESCRIPTION,
  LOGIN_TITLE,
} from '@/lib/constants/metadata';
import { createBreadcrumbs } from '@/lib/routes';

//===================================================================

function LoginPageContent() {
  return (
    <AuthFormShell
      title={LOGIN_TITLE}
      text={LOGIN_DESCRIPTION}
      descriptionItems={[...LOGIN_BENEFITS]}
      breadcrumbs={createBreadcrumbs(LOGIN_TITLE)}
    >
      <LoginForm />
    </AuthFormShell>
  );
}

export default LoginPageContent;
