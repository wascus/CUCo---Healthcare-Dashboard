import { type ReactNode } from "react";
import "./AuthPage.css";

type AuthLayoutProps = {
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

export default function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="auth-container">
      <aside className="auth-left">
        <div className="auth-brand">
          <div className="auth-badge">CUCO</div>
          <h1 className="auth-title">{title ?? "Welcome"}</h1>
          <p className="auth-subtitle">{subtitle ?? "Connect. Reflect. Support."}</p>
          <ul className="auth-points">
            <li>Privacy-first</li>
            <li>Supportive network</li>
            <li>Simple & clear UI</li>
          </ul>
        </div>
      </aside>
      <main className="auth-right">{children}</main>
    </div>
  );
}
