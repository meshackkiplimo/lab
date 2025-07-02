import React from "react";
import "./forgotPassword.css";

const ForgotPassword = () => {
  return (
    <div className="forgot-password-bg">
      <div className="forgot-password-container">
        <h2 className="forgot-password-title">Forgot Password</h2>
        <form className="forgot-password-form">
          <label className="forgot-password-label" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            className="forgot-password-input"
            placeholder="Enter your email"
            required
          />
          <button
            type="submit"
            className="forgot-password-btn"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;