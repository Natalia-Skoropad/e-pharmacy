export {
  getAdminAppConfiguration,
  getAdminDashboardUrl,
  isAdminAppConfigurationError,
  requireAdminAppConfiguration,
  resolveAdminAppConfiguration,
  AdminAppConfigurationError,
} from './admin-app-config';

export {
  getPharmacyDashboardUrl,
  resolveAuthenticatedRouteForClientApp,
  resolveLoginDestination,
  resolveTrustedClientAuthExternalRedirect,
} from './resolve-login-destination';

export {
  getPharmacyAppConfiguration,
  isPharmacyAppConfigurationError,
  requirePharmacyAppConfiguration,
  resolvePharmacyAppConfiguration,
  PharmacyAppConfigurationError,
} from './pharmacy-app-config';

export {
  getClientAuthErrorMessage,
  getClientPasswordChangeErrorMessage,
} from './auth-error-messages';
