import { useState } from 'react';
import { MOCK_USERS } from '../services/mockData.js';
import { ArrowRight, Mail, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import axios from 'axios';

export const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    axios.post(import.meta.env.VITE_URL + "/api/Auth/login", {
      email: email, password: password
    }).then((e) => { console.log(e); console.log(e.data); onLogin(e.data.data) }).catch((e) => alert("Failed"));
  };

  return (
    <div className="min-vh-100 bg-gradient d-flex align-items-center justify-content-center p-4" style={{ background: 'linear-gradient(to bottom right, #0f172a, #1e293b)' }}>
      <div className="bg-white w-100 rounded-3 shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-500 d-flex flex-column flex-md-row" style={{ maxWidth: '56rem' }}>

        {/* Left Side - Brand & Value Prop */}
        <div className="bg-primary p-4 p-md-5 col-md-6 d-flex flex-column justify-content-center text-center text-md-start position-relative overflow-hidden" style={{ backgroundColor: '#4f46e5' }}>
          {/* Decorative background circle */}
          <div className="position-absolute" style={{ top: '-5rem', left: '-5rem', width: '16rem', height: '16rem', backgroundColor: '#6366f1', borderRadius: '50%', mixBlendMode: 'multiply', filter: 'blur(40px)', opacity: 0.7 }}></div>
          <div className="position-absolute" style={{ bottom: '-5rem', right: '-5rem', width: '16rem', height: '16rem', backgroundColor: '#4338ca', borderRadius: '50%', mixBlendMode: 'multiply', filter: 'blur(40px)', opacity: 0.7 }}></div>

          <div className="position-relative" style={{ zIndex: 10 }}>
            <div className="mx-auto mx-md-0 d-flex align-items-center justify-content-center text-white fs-1 fw-bold mb-4 shadow-lg" style={{ width: '4rem', height: '4rem', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '1rem', backdropFilter: 'blur(4px)' }}>
              L
            </div>
            <h1 className="fs-2 fw-bold text-white mb-3" style={{ letterSpacing: '-0.025em' }}>LabelNexus</h1>
            <p className="text-white-50 fs-6 mb-4" style={{ lineHeight: 1.75, color: '#e0e7ff' }}>
              Enterprise-grade data labeling and annotation management system.
            </p>

            <div className="d-none d-md-flex flex-column gap-3">
              <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ color: '#eef2ff', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                <CheckCircle size={20} className="flex-shrink-0" style={{ color: '#c7d2fe' }} />
                <span className="small fw-medium">Precision Annotation Tools</span>
              </div>
              <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ color: '#eef2ff', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                <CheckCircle size={20} className="flex-shrink-0" style={{ color: '#c7d2fe' }} />
                <span className="small fw-medium">Automated QA Workflows</span>
              </div>
              <div className="d-flex align-items-center gap-3 p-3 rounded-3" style={{ color: '#eef2ff', backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)' }}>
                <CheckCircle size={20} className="flex-shrink-0" style={{ color: '#c7d2fe' }} />
                <span className="small fw-medium">Real-time Team Collaboration</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="p-4 p-md-5 col-md-6 bg-white d-flex flex-column justify-content-center">
          <div className="mb-4 mb-md-5">
            <h2 className="fs-3 fw-bold text-slate-900">Welcome back</h2>
            <p className="small text-slate-500 mt-1">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
            <div className="d-flex flex-column gap-1">
              <label className="small fw-bold text-slate-700 text-uppercase" style={{ letterSpacing: '0.05em' }}>Email Address</label>
              <div className="position-relative">
                <Mail size={18} className="position-absolute text-slate-400" style={{ left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-control ps-5 py-2 bg-slate-50 border-slate-200 rounded-3"
                  style={{ fontSize: '0.875rem' }}
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="d-flex flex-column gap-1">
              <label className="small fw-bold text-slate-700 text-uppercase" style={{ letterSpacing: '0.05em' }}>Password</label>
              <div className="position-relative">
                <Lock size={18} className="position-absolute text-slate-400" style={{ left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control ps-5 py-2 bg-slate-50 border-slate-200 rounded-3"
                  style={{ fontSize: '0.875rem' }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="d-flex align-items-center gap-2 small fw-medium p-3 rounded-3 border animate-in slide-in-from-top-2" style={{ color: '#dc2626', backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn w-100 text-white fw-bold py-3 rounded-3 d-flex align-items-center justify-content-center gap-2 mt-2 shadow active:scale-[0.99] transition-all"
              style={{ backgroundColor: '#4f46e5', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)' }}
            >
              Sign In
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="mt-4 text-center">
            <a href="#" className="small fw-medium" style={{ color: '#4f46e5', textDecoration: 'none' }}>Forgot Password?</a>
          </div>
        </div>
      </div>

      <div className="position-fixed bottom-0 text-slate-500 small fw-medium mb-3" style={{ fontSize: '0.75rem' }}>
        Secure System v2.1.0 &bull; LabelNexus Inc.
      </div>
    </div>
  );
};





