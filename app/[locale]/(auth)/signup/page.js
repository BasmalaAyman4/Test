"use client";
import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import authimg from "@/assets/auth.jpg";
import styles from "@/styles/auth/auth.module.css";
import Link from "next/link";
import Image from "next/image";
import OtpInput from "react-otp-input";
import SubmitButton from "@/components/ui/SubmitButton";
import { useDictionary } from "@/hooks/useDirection";

const SignupForm = () => {
  const router = useRouter();
  const { signup, verifyOTP, setPassword, setPersonalInfo, loading, error, clearError } = useAuth();
  const { dictionary, loading: dictLoading, t, locale } = useDictionary();
  const langCode = locale == 'en' ? '2' : '1'
  const [currentStep, setCurrentStep] = useState(0);
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userId, setUserId] = useState("");
  const [userData, setUserData] = useState({});
  const [formData, setFormData] = useState({
    mobile: "",
    password: "",
    firstName: "",
    lastName: "",
    birthDate: "",
    gender: "1"
  });

  const handleNext = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) clearError();
  }, [error, clearError]);

  // Step 1: Mobile signup
  const handleMobileSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (loading) return;

    const result = await signup(formData.mobile, langCode);
    if (result.success) {
      setUserId(result.userId);
      handleNext();
    }
  }, [formData.mobile, loading, signup, handleNext]);

  // Step 2: OTP verification
  const handleOtpSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (loading) return;

    const result = await verifyOTP(userId, otp, langCode);
    if (result.success) {
      handleNext();
    }
  }, [userId, otp, loading, verifyOTP, handleNext]);

  // Step 3: Password setting
  const handlePasswordSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (loading) return;

    const result = await setPassword(userId, formData.password, langCode);
    if (result.success) {
      setUserData(result.userData);
      handleNext();
    }
  }, [userId, formData.password, loading, setPassword, handleNext]);

  // Step 4: Personal info
  const handlePersonalInfoSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (loading) return;

    const personalData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      birthDate: formData.birthDate,
      gender: formData.gender
    };

    const result = await setPersonalInfo(userData.token, personalData, langCode);
    if (result.success) {
      await signIn("credentials", {
        redirect: false,
        id: userData.userId,
        mobile: userData.lastMobileDigit,
        token: userData.token,
        firstName: userData.firstName,
        lastName: userData.lastName,
      });
      router.push("/");
    }
  }, [formData, userData, loading, setPersonalInfo, router]);

  const renderSteps = () => {
    return [0, 1, 2, 3].map((step, index) => {
      let className = styles.step__item;
      if (index < currentStep) {
        className += ` ${styles.active}`;
      } else if (index === currentStep) {
        className += ` ${styles.loading}`;
      }
      return (
        <div key={index} className={className}>
          {index === currentStep && <span></span>}
        </div>
      );
    });
  };

  const renderCurrentStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <h2 className={styles.signup__title}>
              {t("auth.Letsstartwith")} <span>{t("auth.yourmobilenumber")}</span>
            </h2>
            <p className={styles.auth__para}>
              {t("auth.Alreadyhadanaccount?")} <Link href={`/${locale}/login`}>{t("auth.Login")}</Link>
            </p>
            <form onSubmit={handleMobileSubmit}>
              <div className={styles.Login__container}>
                <input
                  type="tel"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  placeholder={t("auth.enteryourphonenumber")}
                  className={styles.custom__input}
                  required
                  disabled={loading}
                />
              </div>
              <SubmitButton text={t("auth.SendOTP")} loading={loading} />
            </form>
          </>
        );

      case 1:
        return (
          <>
            <h2 className={styles.signup__title}>
              {t("auth.Pleaseverify")} <span>{t("auth.yourmobilenumber")}</span>
            </h2>
            <form onSubmit={handleOtpSubmit}>
              <div className={`${styles.otp__body} mb-5`}>
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  numInputs={6}
                  renderSeparator={""}
                  renderInput={(props) => <input {...props} disabled={loading} />}
                />
              </div>
              <SubmitButton text={t("auth.Verify Account")} loading={loading} />
            </form>
          </>
        );

      case 2:
        return (
          <>
            <h2 className={styles.signup__title}>
              {t("auth.Pleaseset")} <span>{t("auth.yourpassword")}</span>
            </h2>
            <form onSubmit={handlePasswordSubmit}>
              <div className={styles.password__body}>
                <div className={styles.Login__container}>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder={t("auth.password")}
                    className={styles.custom__input}
                    required
                    disabled={loading}
                  />
                </div>
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className={styles.pass__body}
                  disabled={loading}
                >
                  {showPassword ? t("auth.Hide") : t("auth.Show")}
                </button>
              </div>
              <SubmitButton text={t("auth.Continue")} loading={loading} />
            </form>
          </>
        );

      case 3:
        return (
          <>
            <h2 className={styles.signup__title}>
              Please set <span>your personal info</span>
            </h2>
            <form onSubmit={handlePersonalInfoSubmit}>
              <div className={styles.Login__container}>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="First Name"
                  className={styles.custom__input}
                  required
                  disabled={loading}
                />
              </div>

              <div className={styles.Login__container}>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last Name"
                  className={styles.custom__input}
                  required
                  disabled={loading}
                />
              </div>

              <div className={styles.Login__container}>
                <input
                  type="date"
                  name="birthDate"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  className={styles.custom__input}
                  required
                  disabled={loading}
                />
              </div>

              <div className={styles.dropdown__container}>
                <select
                  className={styles.dropdown__select}
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="1">Male</option>
                  <option value="2">Female</option>
                </select>
              </div>
              <SubmitButton text="Submit" loading={loading} />
            </form>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <section className={styles.signup__sec}>
      <div className={styles.signin__body}>
        <div>
          <Image
            alt="Authentication"
            src={authimg}
            className={styles.auth__img}
            priority
          />
        </div>
        <div>
          <div className={styles.steps__container}>
            {renderSteps()}
          </div>
          <div className={styles.login__body}>
            {renderCurrentStepContent()}
            {error && (
              <div className={styles.error__message}>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SignupForm;