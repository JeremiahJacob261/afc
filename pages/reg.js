
import { useState } from "react"
import { Visibility, VisibilityOff } from "@mui/icons-material"
import styles from "./signup-form.module.css"

export default function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>BFC</h1>
      <p className={styles.subtitle}>
        Sign up now and get
        <br />a free USDT to invest!
      </p>

      <form className={styles.form}>
        <input type="email" placeholder="Email" className={styles.input} />

        <input type="email" placeholder="Confirm Email" className={styles.input} />

        <div className={styles.countrySelect}>
          <div className={styles.flag}>🇮🇳 +91 India</div>
        </div>

        <input type="tel" placeholder="Phone" className={styles.input} />

        <div className={styles.passwordField}>
          <input type={showPassword ? "text" : "password"} placeholder="Password" className={styles.input} />
          <div className={styles.passwordToggle} onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? <VisibilityOff /> : <Visibility />}
          </div>
        </div>

        <div className={styles.passwordField}>
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            className={styles.input}
          />
          <div className={styles.passwordToggle} onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
            {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
          </div>
        </div>

        <label className={styles.checkbox}>
          <input type="checkbox" />
          <span>Do you accept our Terms and Conditions?</span>
        </label>

        <button type="submit" className={styles.registerButton}>
          Register
        </button>
      </form>

      <div className={styles.loginText}>
        Already have an Account?
        <a href="#" className={styles.loginLink}>
          Login
        </a>
      </div>
    </div>
  )
}

