import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/RegisterPage.css";
import { API_BASE } from "../utils/api";
import Turnstile from "react-turnstile";

const RegisterForm = () => {
  const [captchaKey, setCaptchaKey] = React.useState(0);
  const [username, setUsername] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [dateOfBirth, setDateOfBirth] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [turnstileToken, setTurnstileToken] = React.useState("");
  const [PDPA, setPDPA] = React.useState(false);
  const navigate = useNavigate();

  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState("");

  // Username
  const handleUserName = async (e) => {
    const value = e.target.value;

    // Enforce max length
    if (value.length > 50) {
      setError("Username must be 50 characters or fewer.");
      return;
    }

    if (!/^[a-zA-Z0-9_]*$/.test(value)) {
      setError("Username can only contain letters, numbers, and underscores.");
      return;
    }

    setUsername(value);
    setSubmitted(false);

    const res = await fetch(`${API_BASE}/check_username?username=${value}`);
    const data = await res.json();
    setError(
      data.exists ? "Username already exists. Please choose another." : ""
    );
  };

  // Display Name
  const handleDisplayName = (e) => {
    const value = e.target.value;

    // Enforce max length
    if (value.length > 50) {
      setError("Display name must be 50 characters or fewer.");
      return;
    }

    setDisplayName(value);
    setSubmitted(false);
  };

  // Email
  const handleEmail = async (e) => {
    const value = e.target.value.trim();

    // Enforce max length
    if (value.length > 32) {
      setError("Email must be 32 characters or fewer.");
      return;
    }

    setEmail(value);
    setSubmitted(false);

    const emailRegex = /^[0-9]{7}@sit\.singaporetech\.edu\.sg$/;
    if (!emailRegex.test(value)) {
      setError("Email must be in the format 7digits@sit.singaporetech.edu.sg.");
      return;
    }

    const res = await fetch(`${API_BASE}/check_email?email=${value}`);
    const data = await res.json();
    setError(data.exists ? "Email already exists. Please use another or verify your account." : "");
  };

  // Password
  const handlePassword = (e) => {
    const value = e.target.value;

    // Enforce max length
    if (value.length > 64) {
      setError("Password must be 64 characters or fewer.");
      return;
    }

    setPassword(value);
    setSubmitted(false);

    // Edit: Compliance with NIST SP 800-63B guidelines for password complexity
    const pwRegex = /^.{8,64}$/;
    setError(
      !pwRegex.test(value)
        ? "Password must be at least 8 characters (up to 64 allowed)."
        : ""
    );
  };

  // Confirm Password
  const handleConfirmPassword = (e) => {
    const value = e.target.value;

    // Enforce max length
    if (value.length > 64) {
      setError("Password must be 64 characters or fewer.");
      return;
    }

    setConfirmPassword(value);
    setSubmitted(false);

    setError(value !== password ? "Passwords do not match." : "");
  };

  // Date of Birth
  const handleDateOfBirth = (e) => {
    const value = e.target.value;
    setDateOfBirth(value);
    setSubmitted(false);

    const dob = new Date(value);
    const today = new Date();
    const minAgeDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );

    if (dob > today) {
      setError("Date of birth cannot be in the future.");
    } else if (dob > minAgeDate) {
      setError("You must be at least 18 years old to register.");
    } else {
      setError("");
    }
  };

  // Gender
  const handleGender = (e) => {
    setGender(e.target.value);
    setSubmitted(false);
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !username ||
      !displayName ||
      !email ||
      !password ||
      !confirmPassword ||
      !dateOfBirth ||
      !gender
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!turnstileToken) {
      setError("Please complete the CAPTCHA.");
      return;
    }

    if (!PDPA) {
      setError("You must agree to the PDPA policy to register.");
      return;
    }

    // Validataion
    const emailRegex = /^[0-9]{7}@sit\.singaporetech\.edu\.sg$/;
    const pwRegex = /^.{8,64}$/;
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const minAgeDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );

    if (!emailRegex.test(email)) {
      setError("Invalid email format.");
      return;
    }

    if (!pwRegex.test(password)) {
      setError("Password must be at least 8 characters (up to 64 allowed).");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (dob > minAgeDate) {
      setError("You must be at least 18 years old.");
      return;
    }

    let success = false;

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          display_name: displayName,
          email,
          password,
          confirmPassword,
          dob: dateOfBirth,
          gender,
          turnstileToken,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to register.");
      }

      const data = await response.json();
      console.log("Registration successful:", data);
      setSubmitted(true);
      success = true;
    } catch (error) {
      console.error("Error:", error.message);
      setError("Registration failed. " + error.message);

      // Bump captchaKey to remount widget on any error
      setCaptchaKey((k) => k + 1);
      setTurnstileToken("");
    }

    // Redirect to Login page
    if (success) {
      setError("");
      
      // Wait a few seconds before navigating
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    }
  };

  return (
    <div className="register-form">
      <div className="register-scroll-area">
        <div>
          <h1>Registration</h1>
        </div>
        {(error || submitted) && (
          <div className="message-overlay">
            {error && <p className="error">{error}</p>}
            {submitted && <p className="success">Registration successful. A verification link has been sent to your email.<br/>Redirecting to login...</p>}
          </div>
        )}
        <form>
          <label className="input">Username</label>
          <input
            type="text"
            value={username}
            maxLength={50}
            onChange={handleUserName}
            placeholder="Enter your username"
          />
          <label className="input">Display Name</label>
          <input
            type="text"
            value={displayName}
            maxLength={50}
            onChange={handleDisplayName}
            placeholder="Enter your display name"
          />
          <label className="input">Email</label>
          <input
            type="email"
            value={email}
            maxLength={32}
            onChange={handleEmail}
            placeholder="Enter your email"
          />
          <label className="label">Password</label>
          <input
            type="password"
            value={password}
            maxLength={64}
            onChange={handlePassword}
            placeholder="Enter your password"
          />
          <label className="label">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            maxLength={64}
            onChange={handleConfirmPassword}
            placeholder="Confirm your password"
          />
          <label className="label">Date of Birth</label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={handleDateOfBirth}
            max={new Date().toISOString().split("T")[0]}
          />

          <label className="label">Gender</label>
          <div className="gender">
            <input
              type="radio"
              value="Male"
              checked={gender === "Male"}
              onChange={handleGender}
            />{" "}
            Male
            <input
              type="radio"
              value="Female"
              checked={gender === "Female"}
              onChange={handleGender}
            />{" "}
            Female
            <input
              type="radio"
              value="Other"
              checked={gender === "Other"}
              onChange={handleGender}
            />{" "}
            Other
          </div>
          
          <div className="pdpa">
            <input
              type="checkbox"
              id="pdpa"
              checked={PDPA}
              onChange={(e) => setPDPA(e.target.checked)}
            />
            <div className="pdpa-text">
              <label htmlFor="pdpa">I agree to the PDPA policy.</label>
              <p className="pdpa-desc">
                Your data will be used strictly for registration, communication,
                and platform operations in accordance with privacy laws.
              </p>
            </div>
          </div>

          <div className="captcha-wrapper">
            <Turnstile
              key={captchaKey}
              sitekey="0x4AAAAAABggEHopXzOti5eu"
              onVerify={setTurnstileToken}
              theme="dark"
            />
          </div>

          <div className="subButton">
            <button type="submit" onClick={handleSubmit}>
              Register
            </button>
          </div>
          <p className="haveAccount">
            Already have an account? <a href="/login">Login</a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
