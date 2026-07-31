import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

//===================================================================

const ROOT = resolve(import.meta.dirname, '../../..');
const read = (path) => readFile(resolve(ROOT, path), 'utf8');
const violations = [];

const requirePattern = (source, pattern, message) => {
  if (!pattern.test(source)) violations.push(message);
};

const forbidPattern = (source, pattern, message) => {
  if (pattern.test(source)) violations.push(message);
};

const [
  appShell,
  cartModal,
  reviewComposer,
  reviewRating,
  favorite,
  stock,
  details,
  header,
  mobile,
  footer,
  infoPage,
] = await Promise.all([
  read('apps/client/src/components/layout/AppShell/AppShell.tsx'),

  read(
    'apps/client/src/components/common/CartOrderLimitModal/CartOrderLimitModal.tsx'
  ),

  read('apps/client/src/components/common/ReviewsSection/ReviewComposer.tsx'),

  read(
    'apps/client/src/components/common/ReviewsSection/ReviewRatingInput.tsx'
  ),

  read(
    'apps/client/src/components/common/FavoriteToggleButton/FavoriteToggleButton.tsx'
  ),

  read(
    'apps/client/src/components/common/StockAvailability/StockAvailability.tsx'
  ),

  read('apps/client/src/components/common/DetailsUnavailablePage.tsx'),
  read('apps/client/src/components/layout/Header/Header.tsx'),
  read('apps/client/src/components/layout/MobileOffcanvas/MobileOffcanvas.tsx'),
  read('apps/client/src/components/layout/Footer/Footer.tsx'),
  read('apps/client/src/components/info/InfoPage/InfoPage.tsx'),
]);

//===================================================================

requirePattern(
  appShell,
  /href="#main-content"/,
  'AppShell: skip-to-content link is missing.'
);

requirePattern(
  appShell,
  /id="main-content"/,
  'AppShell: stable skip target is missing.'
);

requirePattern(
  cartModal,
  /describedBy=\{descriptionId\}/,
  'CartOrderLimitModal: aria-describedby contract is missing.'
);

requirePattern(
  cartModal,
  /initialFocusRef=\{dismissButtonRef\}/,
  'CartOrderLimitModal: dismiss action must receive initial focus.'
);

if ((cartModal.match(/<Button\b/g) ?? []).length !== 1)
  violations.push(
    'CartOrderLimitModal: exactly one primary dismiss action is required.'
  );

requirePattern(
  reviewComposer,
  /<ReviewRatingInput/,
  'ReviewComposer: accessible rating input composition is missing.'
);

requirePattern(
  reviewRating,
  /role="radiogroup"/,
  'ReviewRatingInput: rating radiogroup is missing.'
);

requirePattern(
  reviewRating,
  /type="radio"/,
  'ReviewRatingInput: rating options must be radios.'
);

requirePattern(
  reviewRating,
  /aria-invalid=/,
  'ReviewRatingInput: rating invalid state is missing.'
);

requirePattern(
  reviewRating,
  /aria-describedby=/,
  'ReviewRatingInput: rating error description is missing.'
);

requirePattern(
  favorite,
  /aria-busy=\{pending \|\| undefined\}/,
  'FavoriteToggleButton: pending state must be announced.'
);

requirePattern(
  favorite,
  /interactionLockRef/,
  'FavoriteToggleButton: rapid-click lock is missing.'
);

requirePattern(
  stock,
  /Availability is not confirmed\./,
  'StockAvailability: unknown wording is missing.'
);

forbidPattern(
  stock,
  /Math\.max\(0/,
  'StockAvailability: malformed values must not be normalized to zero.'
);

requirePattern(
  details,
  /<main>/,
  'DetailsUnavailablePage: main landmark is missing.'
);

requirePattern(
  details,
  /router\.refresh\(\)/,
  'DetailsUnavailablePage: retry must use router.refresh().'
);

forbidPattern(
  details,
  /window\.location\.reload/,
  'DetailsUnavailablePage: full page reload is forbidden.'
);

requirePattern(
  header,
  /Checking your session/,
  'Header: session loading status is missing.'
);

requirePattern(
  header,
  /formatCountLabel/,
  'Header: canonical count label formatter is missing.'
);

requirePattern(
  mobile,
  /onClick=\{onClose\}/,
  'MobileOffcanvas: navigation actions must close the menu directly.'
);

forbidPattern(
  footer,
  /target="_blank"/,
  'Footer: unverified external links must not be rendered.'
);

requirePattern(
  infoPage,
  /dateTime=\{metadata\.updatedAt\.iso\}/,
  'InfoPage: machine-readable revision date is missing.'
);

if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log('Client component accessibility contract check passed.');
