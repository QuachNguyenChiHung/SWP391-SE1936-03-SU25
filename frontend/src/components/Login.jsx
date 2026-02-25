import { useState, useEffect, useRef } from 'react';

import { ArrowRight, Mail, Lock, AlertCircle, CheckCircle, Eye, EyeOff, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../ultis/api.js';
import './Login.css';


export const Login = ({ onLogin }) => {
  // ===== STATE MANAGEMENT =====
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [emailValid, setEmailValid] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const emailInputRef = useRef(null);


  // ===== EFFECTS =====
  // Auto-focus email input on mount
  useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Email validation
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(emailRegex.test(email));
  }, [email]);

  // Password strength meter
  useEffect(() => {
    if (password.length === 0) {
      setPasswordStrength('');
    } else if (password.length < 6) {
      setPasswordStrength('weak');
    } else if (password.length < 10) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  }, [password]);

  // ===== EVENT HANDLERS =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post("/Auth/login", {
        email: email, password: password
      });
      console.log("Login response:", response.data);
      const user = response.data.data;
      onLogin(user);
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password. Please try again.');
    }
  };

  const navigate = useNavigate();

  const goForgot = (e) => {
    e.preventDefault();
    navigate('/forgot-password');
  };

  // ===== RENDER =====
  return (
    <div className="login-container">
      <div className="login-card">

        {/* ===== LEFT SIDE - BRANDING ===== */}
        <div className="login-branding">
          <div className="branding-circle-1"></div>
          <div className="branding-circle-2"></div>

          <div className="branding-content">
            <div className="branding-logo" aria-hidden="true">
              L
            </div>
            <h1 className="branding-title">LabelNexus</h1>
            <p className="branding-description">
              Enterprise-grade data labeling and annotation management system.
            </p>

            <div className="branding-features">
              <div className="branding-feature">
                <CheckCircle size={20} className="branding-feature-icon" aria-hidden="true" />
                <span className="branding-feature-text">Precision Annotation Tools</span>
              </div>
              <div className="branding-feature">
                <CheckCircle size={20} className="branding-feature-icon" aria-hidden="true" />
                <span className="branding-feature-text">Automated QA Workflows</span>
              </div>
              <div className="branding-feature">
                <CheckCircle size={20} className="branding-feature-icon" aria-hidden="true" />
                <span className="branding-feature-text">Real-time Team Collaboration</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== RIGHT SIDE - LOGIN FORM ===== */}
        <div className="login-form-container">
          <div className="form-header">
            <h2 className="form-title">Welcome back</h2>
            <p className="form-subtitle">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>

            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email-input" className="form-label">
                Email Address
              </label>
              <div className="input-wrapper">
                <Mail
                  size={18}
                  className="input-icon"
                  aria-hidden="true"
                />
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  ref={emailInputRef}
                  className={`form-input ${error ? 'input-error' : ''}`}
                  placeholder="name@company.com"
                  required
                  aria-label="Email address"
                  aria-describedby="email-hint"
                  aria-invalid={error ? 'true' : 'false'}
                />
                {email && emailValid && (
                  <Check
                    size={18}
                    className="input-icon-right email-valid-icon"
                    aria-hidden="true"
                  />
                )}
              </div>
              {email && !emailValid && (
                <small id="email-hint" className="input-hint" style={{ color: '#dc2626' }}>
                  Please enter a valid email address
                </small>
              )}
              {email && emailValid && (
                <small id="email-hint" className="input-hint" style={{ color: '#10b981' }}>
                  Email format is valid
                </small>
              )}
              {!email && (
                <small id="email-hint" className="input-hint">
                  Enter your email address
                </small>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password-input" className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <Lock
                  size={18}
                  className="input-icon"
                  aria-hidden="true"
                />
                <input
                  id="password-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`form-input ${error ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  required
                  aria-label="Password"
                  aria-describedby="password-strength"
                  aria-invalid={error ? 'true' : 'false'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="input-icon-right password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="form-options">
              <div className="remember-me">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="checkbox-custom"
                  aria-label="Remember me"
                />
                <label htmlFor="remember-me" className="checkbox-label">
                  Remember me
                </label>
              </div>
              <a href="#" onClick={goForgot} className="forgot-password">
                Forgot Password?
              </a>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="error-message"
                role="alert"
                aria-live="polite"
                aria-atomic="true"
              >
                <AlertCircle size={16} aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {/* Success Message */}
            {showSuccess && (
              <div
                className="success-message"
                role="status"
                aria-live="polite"
              >
                <Check size={16} className="success-icon" aria-hidden="true" />
                <span>Login successful! Redirecting...</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || showSuccess}
              className="btn-submit"
              aria-label={isLoading ? 'Signing in, please wait' : 'Sign in to your account'}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="loading-spinner" aria-hidden="true" />
                  <span>Signing In...</span>
                </>
              ) : showSuccess ? (
                <>
                  <Check size={18} className="success-icon" aria-hidden="true" />
                  <span>Success!</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={18} aria-hidden="true" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="login-footer">
        Secure System v2.1.0 &bull; LabelNexus Inc.
      </div>
    </div>
  );
};
