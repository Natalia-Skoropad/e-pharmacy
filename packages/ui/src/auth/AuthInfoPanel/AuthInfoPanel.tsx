import css from './AuthInfoPanel.module.css';

//===================================================================

type AuthInfoPanelProps = {
  title: string;
  text: string;
};

//===================================================================

function AuthInfoPanel({ title, text }: AuthInfoPanelProps) {
  return (
    <div className={css.panel}>
      <p className={css.title}>{title}</p>
      <p className={css.text}>{text}</p>
    </div>
  );
}

export type { AuthInfoPanelProps };
export default AuthInfoPanel;
