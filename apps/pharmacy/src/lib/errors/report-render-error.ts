type RenderError = Error & Readonly<{ digest?: string }>;
type RenderErrorContext = 'route-boundary' | 'root-layout';

//===================================================================

export type RenderErrorDiagnostic = Readonly<{
  category: 'render_error';
  context: RenderErrorContext;
  digest?: string;
  route?: string;
}>;

//===================================================================

export function createRenderErrorDiagnostic(
  error: RenderError,
  context: RenderErrorContext,
  route?: string
): RenderErrorDiagnostic {
  return {
    category: 'render_error',
    context,
    ...(error.digest ? { digest: error.digest } : {}),
    ...(route ? { route } : {}),
  };
}

//===================================================================

export function reportRenderError(
  error: RenderError,
  context: RenderErrorContext
): void {
  const route =
    typeof window === 'undefined' ? undefined : window.location.pathname;
  const diagnostic = createRenderErrorDiagnostic(error, context, route);

  console.error(JSON.stringify(diagnostic));
}
