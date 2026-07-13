export type ResetPasswordScreenProps = {
  isAuthenticated: boolean;
};

export type PasswordInputProps = {
  label: string;
  onChange: (value: string) => void;
  onToggle?: () => void;
  showPassword: boolean;
  value: string;
};
