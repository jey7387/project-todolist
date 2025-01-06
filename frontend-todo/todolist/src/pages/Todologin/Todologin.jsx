import React, { useState } from 'react';
import './Todologin.css';
import icon from '../../assets/icon.png';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Todologin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    setEmailError('');
    setPasswordError('');

    let isValid = true;

    // Validation checks for email and password
    if (!email) {
      setEmailError('Please enter your email');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Please enter your password');
      isValid = false;
    }

    if (isValid) {
      try {
        // Make the POST request to the backend
        const response = await axios.post('http://localhost:4000/login', {
          email,
          password,
        });

        // Assuming the response contains user info with userId
        const userId = response.data.user.id;
        const token = response.data.token; // If your API provides a token

        // Store userId and token in localStorage
        localStorage.setItem('userId', userId);
        if (token) {
          localStorage.setItem('token', token);
        }

        console.log('Login successful:', response.data.message); // Log success message
        navigate('/page'); // Navigate to the next page after successful login
      } catch (error) {
        // Handle errors
        if (error.response && error.response.status === 401) {
          setPasswordError('Invalid credentials'); // Invalid login error
        } else {
          console.error('Server error:', error); // Handle other errors
        }
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="header">
          <img src={icon} alt="Icon" className="header-icon" />
          <h1 className="login-title">To-do List</h1>
        </div>
        <h2 className="login-subtitle">Sign In</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {emailError && <p className="error-message">{emailError}</p>}
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="off"
            />
            {passwordError && <p className="error-message">{passwordError}</p>}
          </div>
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
        <p className="register-link">
          Don’t have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Todologin;
