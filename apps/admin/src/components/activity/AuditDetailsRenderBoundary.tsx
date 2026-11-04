'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

import { ModalBase, ModalRoot } from '@e-pharmacy/ui/overlays';
import { Button } from '@e-pharmacy/ui/primitives';

import css from './ActivityHistory.module.css';

//===================================================================

type Props = Readonly<{
  children: ReactNode;
  onClose: () => void;
  onRetry: () => void;
}>;

type State = Readonly<{ hasError: boolean }>;

//===================================================================

/** A malformed historical snapshot must not crash all of Admin Activity. */
export class AuditDetailsRenderBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the actual React error available for QA; audit snapshot contents
    // and protected user data must not be written into the browser log.
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        'Admin audit details could not be rendered',
        error,
        info.componentStack
      );
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <ModalRoot>
        <ModalBase
          isOpen
          labelledBy="admin-audit-render-error-title"
          dialogClassName={css.detailsDialog}
          onClose={this.props.onClose}
        >
          <div className={css.detailsHeader}>
            <h2
              className={css.detailsTitle}
              id="admin-audit-render-error-title"
            >
              Audit details could not be displayed
            </h2>
          </div>

          <div className={css.detailsBody} role="alert">
            This historical record could not be rendered. The Activity history
            page is still available. Try loading the record again.
            <Button type="button" onClick={this.props.onRetry}>
              Retry details
            </Button>
            <Button type="button" variant="ghost" onClick={this.props.onClose}>
              Close
            </Button>
          </div>
        </ModalBase>
      </ModalRoot>
    );
  }
}
