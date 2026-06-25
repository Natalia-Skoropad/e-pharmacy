export const pharmacyApiRoutes = {
  auth: {
    logout: '/api/auth/logout',
    logoutAll: '/api/auth/logout-all',
    refresh: '/api/auth/refresh',
    current: '/api/auth/me',
    password: '/api/auth/password',
    sessions: '/api/auth/sessions',
    session: (sessionId: string) => `/api/auth/sessions/${sessionId}`,
  },
} as const;
