import { Container } from '../../layout';
import { Logo } from '../../media';

import css from './AuthHeader.module.css';

//===================================================================

type AuthHeaderProps = {
  logoHref?: string | null;
  logoAriaLabel?: string;
};

//===================================================================

function AuthHeader({
  logoHref = '/',
  logoAriaLabel = 'E-PHARMACY home',
}: AuthHeaderProps) {
  return (
    <header className={css.header}>
      <Container className={css.container}>
        <Logo href={logoHref} ariaLabel={logoAriaLabel} />
      </Container>
    </header>
  );
}

export type { AuthHeaderProps };
export default AuthHeader;
