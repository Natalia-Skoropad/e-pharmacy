type RenderError = Error & Readonly<{ digest?: string }>;

export type RenderErrorContext = 'route-boundary' | 'root-layout';

//===================================================================

export type RenderErrorDiagnostic = Readonly<{
  application: 'admin';
  category: 'render_error';
  context: RenderErrorContext;
  digest?: string;
}>;

//===================================================================

export function createRenderErrorDiagnostic(
  error: RenderError,
  context: RenderErrorContext
): RenderErrorDiagnostic {
  return {
    application: 'admin',
    category: 'render_error',
    context,
    ...(error.digest ? { digest: error.digest } : {}),
  };
}

//===================================================================

export function reportRenderError(
  error: RenderError,
  context: RenderErrorContext
): void {
  console.error(createRenderErrorDiagnostic(error, context));
}
