import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import './Auth.css';

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', password: '' });
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.post('/register', formData);
      setSuccess(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/verify-email', {
        email: formData.email,
        code: verificationCode
      });
      alert('Email verified successfully! You can now log in.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    }
  };

  return (
    <div className="auth-container animate-fade-in">
      <div className="card auth-card">
        <h2>{step === 1 ? 'Create an Account' : 'Verify Your Email'}</h2>
        <p className="auth-subtitle">
          {step === 1 ? 'Join Velvet Vine today' : `We sent a code to ${formData.email}`}
        </p>
        
        {error && <div className="error-alert">{error}</div>}
        {success && <div style={{color: 'green', marginBottom: '1rem', background: '#e8f5e9', padding: '10px', borderRadius: '4px'}}>{success}</div>}
        
        {step === 1 ? (
          <form onSubmit={handleRegister} className="auth-form">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" className="input-field" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" className="input-field" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" className="input-field" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required placeholder="09123456789" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" className="input-field" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required minLength="8" />
            </div>
            <button type="submit" className="btn btn-primary full-width">Sign Up</button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="auth-form">
            <div className="form-group">
              <label>6-Digit Verification Code</label>
              <input type="text" className="input-field" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} required placeholder="123456" maxLength="6" />
            </div>
            <button type="submit" className="btn btn-primary full-width">Verify & Continue</button>
          </form>
        )}
        
        {step === 1 && (
          <p className="auth-footer">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;
