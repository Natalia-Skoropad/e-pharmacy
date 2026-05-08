import css from './Toast.module.css';

//===================================================================

type ToastProps = {
  message: string;
  isVisible: boolean;
};

//===================================================================

function Toast({ message, isVisible }: ToastProps) {
  if (!isVisible || !message) return null;

  return (
    <div className={css.toast} role="status" aria-live="polite">
      {message}
    </div>
  );
}

export default Toast;
