import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../ultis/api.js';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';

export const ChangePassword = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const email = state?.email || '';
  
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });

    if (!email) {
      setStatus({ type: 'error', message: 'Session expired. Please start from Forgot Password.' });
      return;
    }
    if (password.length < 6) {
      setStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }
    if (password !== confirm) {
      setStatus({ type: 'error', message: 'Passwords do not match.' });
      return;
    }

    setIsLoading(true);
    try {
      // Gọi API backend
      await api.post('/Auth/change-password', { email, newPassword: password });
      
      setStatus({ type: 'success', message: 'Password changed successfully! Redirecting...' });
      sessionStorage.removeItem('reset_otp');
      
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: err?.response?.data?.message || 'Failed to change password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ maxWidth: 480, width: '100%' }}>
        <div className="card-body p-5">
          
          {/* Header */}
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 text-success rounded-circle mb-3" style={{ width: '60px', height: '60px' }}>
              <ShieldCheck size={32} />
            </div>
            <h3 className="fw-bold text-dark">Secure Your Account</h3>
            <p className="text-muted small mb-0">
              Create a new strong password for <br/>
              <span className="fw-bold text-dark bg-light px-2 py-1 rounded border mt-1 d-inline-block">{email || 'Unknown User'}</span>
            </p>
          </div>

          {/* Status Alert */}
          {status.message && (
            <div className={`alert d-flex align-items-center gap-2 py-2 px-3 small rounded-3 mb-4 ${status.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
              {status.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <div>{status.message}</div>
            </div>
          )}

          <form onSubmit={handleChange}>
            {/* New Password Input */}
            <div className="mb-3">
              <label className="form-label small fw-bold text-muted text-uppercase">New Password</label>
              <div className="input-group input-group-lg">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <Lock size={18} />
                </span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-control bg-light border-start-0 border-end-0 fs-6" 
                  required 
                  placeholder="Min 6 characters"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
                <button 
                  className="btn bg-light border border-start-0 text-muted" 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password Input */}
            <div className="mb-4">
              <label className="form-label small fw-bold text-muted text-uppercase">Confirm Password</label>
              <div className="input-group input-group-lg">
                <span className="input-group-text bg-light border-end-0 text-muted">
                  <Lock size={18} />
                </span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className="form-control bg-light border-start-0 fs-6" 
                  required 
                  placeholder="Re-enter password"
                  value={confirm} 
                  onChange={e => setConfirm(e.target.value)} 
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="d-grid gap-2">
              <button 
                className="btn btn-primary btn-lg fw-semibold" 
                type="submit" 
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <span className="d-flex align-items-center justify-content-center gap-2">
                    <Loader2 size={18} className="animate-spin" /> Updating...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </button>
            </div>
          </form>

          {/* Cancel / Back Link */}
          <div className="text-center mt-4 pt-2 border-top">
            <button 
                type="button"
                onClick={() => navigate('/login')} 
                className="btn btn-link text-decoration-none text-muted d-inline-flex align-items-center gap-2"
                style={{ fontSize: '0.9rem' }}
            >
              <ArrowLeft size={16} /> Cancel & Return to Login
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ChangePassword;