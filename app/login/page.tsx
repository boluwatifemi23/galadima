"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error || "Could not sign in");
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      {/* Left Panel - Branding */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-brand-logo">
            <Image
              src="/harmony-logo.png"
              alt="Harmony Garden"
              width={120}
              height={120}
              style={{ objectFit: "contain" }}
            />
          </div>
          <h1 className="login-brand-name">Galadima</h1>
          <p className="login-brand-tagline"></p>
          <div className="login-brand-divider" />
          <p className="login-brand-desc">
            Internal Tool
          </p>
        </div>
        <p className="login-copyright">
          &copy; {new Date().getFullYear()} Harmony Garden & Estate Development Ltd.
        </p>
      </div>

      {/* Right Panel - Form */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2 className="login-title">Sign In</h2>
            <p className="login-subtitle">
              Enter your work credentials to access the system.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email" className="form-label required">
                Work Email
              </label>
              <input
                id="email"
                type="email"
                className={`form-input${error ? " error" : ""}`}
                placeholder="you@landbookbyharmony.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                disabled={loading}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 24 }}>
              <label htmlFor="password" className="form-label required">
                Password
              </label>
              <div className="password-field">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`form-input${error ? " error" : ""}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: "100%" }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: 16, height: 16 }} />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Access is restricted to authorised Harmony Garden staff only.<br />
              Contact your administrator if you cannot log in.
            </p>
          </div>
        </div>
      </div>
      <style>{`
        .login-page {
          display: flex;
          min-height: 100vh;
          background: #ffffff;
        }

        .login-left {
          width: 420px;
          min-height: 100vh;
          background: var(--color-neutral-900);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 48px;
          position: relative;
          flex-shrink: 0;
        }

        .login-left::after {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          width: 3px;
          height: 100%;
          background: var(--color-primary);
        }

        .login-brand {
          text-align: center;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .login-brand-logo {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 28px;
          box-shadow: 0 0 0 6px rgba(196, 18, 48, 0.15);
        }

        .login-brand-name {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 4px;
          letter-spacing: -0.01em;
        }

        .login-brand-tagline {
          font-size: 0.875rem;
          color: var(--color-neutral-400);
          margin-bottom: 28px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .login-brand-divider {
          width: 40px;
          height: 3px;
          background: var(--color-primary);
          margin: 0 auto 24px;
          border-radius: 2px;
        }

        .login-brand-desc {
          font-size: 0.9375rem;
          color: var(--color-neutral-400);
          line-height: 1.7;
          text-align: center;
        }

        .login-copyright {
          font-size: 0.75rem;
          color: var(--color-neutral-600);
          text-align: center;
          padding-top: 24px;
          border-top: 1px solid var(--color-neutral-800);
          width: 100%;
        }

        .login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          background: #ffffff;
        }

        .login-card {
          width: 100%;
          max-width: 420px;
        }

        .login-card-header {
          margin-bottom: 32px;
        }

        .login-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--color-neutral-900);
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .login-subtitle {
          font-size: 0.9375rem;
          color: var(--color-neutral-500);
        }

        .login-form {
          margin-bottom: 32px;
        }

        .login-error {
          background: var(--color-primary-muted);
          border: 1px solid rgba(196, 18, 48, 0.2);
          border-radius: var(--radius-md);
          color: var(--color-primary);
          font-size: 0.875rem;
          font-weight: 500;
          padding: 12px 16px;
          margin-bottom: 20px;
        }

        .password-field {
          position: relative;
        }

        .password-field .form-input {
          padding-right: 64px;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-neutral-500);
          cursor: pointer;
          padding: 4px 6px;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          font-family: var(--font-inter);
        }

        .password-toggle:hover {
          color: var(--color-neutral-800);
        }

        .login-footer {
          padding-top: 24px;
          border-top: 1px solid var(--color-neutral-100);
        }

        .login-footer p {
          font-size: 0.8125rem;
          color: var(--color-neutral-400);
          line-height: 1.6;
          text-align: center;
        }

        @media (max-width: 768px) {
          .login-page {
            flex-direction: column;
          }

          .login-left {
            width: 100%;
            min-height: auto;
            padding: 40px 24px;
          }

          .login-left::after {
            width: 100%;
            height: 3px;
            top: auto;
            bottom: 0;
            right: 0;
          }

          .login-brand {
            flex-direction: row;
            text-align: left;
            gap: 20px;
            flex: unset;
            justify-content: flex-start;
          }

          .login-brand-logo {
            width: 64px;
            height: 64px;
            margin-bottom: 0;
            flex-shrink: 0;
          }

          .login-brand-divider,
          .login-brand-desc,
          .login-brand-tagline {
            display: none;
          }

          .login-brand-name {
            margin-bottom: 2px;
          }

          .login-copyright {
            display: none;
          }

          .login-right {
            padding: 40px 20px;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}