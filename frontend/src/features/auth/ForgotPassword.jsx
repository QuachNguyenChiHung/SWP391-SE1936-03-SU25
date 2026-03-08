import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import { Mail, KeyRound, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [otpSent, setOtpSent] = useState(false);
  
  // Thay đổi: State OTP giờ là mảng 6 chuỗi rỗng thay vì 1 string dài
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  
  // Ref để quản lý focus của 6 ô input
  const inputRefs = useRef([]); 
  const navigate = useNavigate();

  const generateOtp = (len = 6) => {
    let s = '';
    for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
    return s;
  };

  const sendEmailJs = async (toEmail, otpCode) => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_l4wlzvq';
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_jakqwup';
    const userId = import.meta.env.VITE_EMAILJS_USER_ID || 't9HNMNIZ81a3la4qs';

    const templateParams = {
      otp: otpCode,
      user_email: toEmail,
    };
    return await emailjs.send(serviceId, templateId, templateParams, userId);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    setIsLoading(true);

    const otpCode = generateOtp(6);
    try {
      await sendEmailJs(email, otpCode);
      const expiry = Date.now() + 5 * 60 * 1000;
      sessionStorage.setItem('reset_otp', JSON.stringify({ email, otp: otpCode, expiry }));
      setOtpSent(true);
      setStatus({ type: 'success', message: 'OTP sent! Please check your inbox.' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'Failed to send OTP. Please try again later.' });
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIC XỬ LÝ 6 Ô INPUT OTP ---

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return; // Chỉ cho phép nhập số

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Nếu đã nhập số và không phải ô cuối, chuyển focus sang ô tiếp theo
    if (element.value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // Xử lý nút Backspace
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        // Nếu ô hiện tại rỗng và nhấn xóa, lùi về ô trước
        inputRefs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6); // Lấy 6 ký tự đầu
    if (!/^\d+$/.test(pastedData)) return; // Nếu paste chữ thì bỏ qua

    const digits = pastedData.split("");
    const newOtp = [...otp];
    
    digits.forEach((digit, idx) => {
        if(idx < 6) newOtp[idx] = digit;
    });
    setOtp(newOtp);
    
    // Focus vào ô cuối cùng sau khi paste
    const focusIndex = digits.length < 6 ? digits.length : 5;
    inputRefs.current[focusIndex].focus();
  };

  // ------------------------------------

  const handleVerify = (e) => {
    e.preventDefault();
    const raw = sessionStorage.getItem('reset_otp');
    const enteredOtp = otp.join(""); // Gộp mảng 6 số thành chuỗi

    if (!raw) {
      setStatus({ type: 'error', message: 'No OTP found or it expired.' });
      return;
    }

    const obj = JSON.parse(raw);
    if (obj.expiry < Date.now()) {
      sessionStorage.removeItem('reset_otp');
      setOtpSent(false);
      setStatus({ type: 'error', message: 'OTP expired. Please request a new one.' });
      return;
    }

    if (obj.email !== email) {
      setStatus({ type: 'error', message: 'Email does not match the request.' });
      return;
    }

    if (enteredOtp.length !== 6) {
        setStatus({ type: 'error', message: 'Please enter full 6-digit code.' });
        return;
    }

    if (obj.otp !== enteredOtp) {
      setStatus({ type: 'error', message: 'Invalid OTP code.' });
      return;
    }

    setStatus({ type: 'success', message: 'Verified! Redirecting...' });
    setTimeout(() => {
        navigate('/change-password', { state: { email } });
    }, 1000);
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5">
      <div className="card border-0 shadow-lg rounded-4 overflow-hidden" style={{ maxWidth: 480, width: '100%' }}>
        <div className="card-body p-5">
          
          {/* Header */}
          <div className="text-center mb-4">
            <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{ width: '60px', height: '60px' }}>
              {otpSent ? <KeyRound size={28} /> : <Mail size={28} />}
            </div>
            <h3 className="fw-bold text-dark">{otpSent ? 'Enter Verification Code' : 'Forgot Password?'}</h3>
            <p className="text-muted small mb-0">
              {otpSent 
                ? `We sent a code to ${email}`
                : "No worries, we'll send you reset instructions."}
            </p>
          </div>

          {/* Status Alert */}
          {status.message && (
            <div className={`alert d-flex align-items-center gap-2 py-2 px-3 small rounded-3 mb-4 ${status.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
              {status.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <div>{status.message}</div>
            </div>
          )}

          {!otpSent ? (
            /* FORM GỬI MAIL (Giữ nguyên) */
            <form onSubmit={handleSend}>
              <div className="mb-4">
                <label className="form-label small fw-bold text-muted text-uppercase">Email Address</label>
                <div className="input-group input-group-lg">
                  <span className="input-group-text bg-light border-end-0 text-muted">
                    <Mail size={18} />
                  </span>
                  <input 
                    type="email" 
                    className="form-control bg-light border-start-0 fs-6" 
                    placeholder="name@example.com"
                    required 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                  />
                </div>
              </div>
              
              <div className="d-grid gap-2">
                <button className="btn btn-primary btn-lg fw-semibold" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <span className="d-flex align-items-center justify-content-center gap-2">
                      <Loader2 size={18} className="animate-spin" /> Sending...
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* FORM NHẬP OTP (Cải tiến thành 6 ô) */
            <form onSubmit={handleVerify}>
              <div className="mb-4">
                <label className="form-label small fw-bold text-muted text-uppercase d-block text-center mb-3">
                    Type your 6-digit security code
                </label>
                
                {/* Khu vực chứa 6 ô input */}
                <div className="d-flex gap-2 justify-content-center mb-3">
                    {otp.map((data, index) => {
                        return (
                            <input
                                key={index}
                                type="text"
                                maxLength="1"
                                className="form-control text-center fw-bold fs-4 p-0"
                                style={{ width: '45px', height: '50px', borderRadius: '8px' }}
                                value={data}
                                ref={el => inputRefs.current[index] = el}
                                onChange={e => handleChange(e.target, index)}
                                onKeyDown={e => handleKeyDown(e, index)}
                                onPaste={handlePaste}
                                onFocus={e => e.target.select()} // Tự bôi đen số khi click vào để sửa nhanh
                            />
                        );
                    })}
                </div>

                <div className="form-text text-center mt-3">
                    <button 
                        type="button" 
                        className="btn btn-link p-0 text-decoration-none small"
                        onClick={() => { 
                            setOtpSent(false); 
                            setStatus({type:'', message:''}); 
                            setOtp(new Array(6).fill("")); // Reset ô nhập
                        }}
                    >
                        Didn't receive code? <span className="fw-bold">Resend</span>
                    </button>
                </div>
              </div>

              <div className="d-grid gap-2">
                <button className="btn btn-primary btn-lg fw-semibold" type="submit">
                  Verify Code
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="text-center mt-4 pt-2 border-top">
            <button 
                onClick={() => navigate(-1)} 
                className="btn btn-link text-decoration-none text-muted d-inline-flex align-items-center gap-2"
                style={{ fontSize: '0.9rem' }}
            >
              <ArrowLeft size={16} /> Back to Login
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;