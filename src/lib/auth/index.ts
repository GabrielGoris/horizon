export const MIN_PASSWORD_LENGTH = 12;

export function getPasswordValidationMessage(password: string) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'Inclua letra maiuscula, minuscula, numero e simbolo.';
  }

  return null;
}

export function getAuthErrorMessage(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('invalid login') || normalizedMessage.includes('invalid credentials')) {
    return 'E-mail ou senha incorretos.';
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.';
  }

  if (normalizedMessage.includes('already registered') || normalizedMessage.includes('already been registered')) {
    return 'Esse e-mail ja esta registrado.';
  }

  if (normalizedMessage.includes('captcha')) {
    return 'Conclua a verificacao de seguranca e tente novamente.';
  }

  if (normalizedMessage.includes('same password')) {
    return 'A nova senha precisa ser diferente da atual.';
  }

  if (normalizedMessage.includes('current password') || normalizedMessage.includes('current_password')) {
    return 'A senha atual esta incorreta.';
  }

  if (normalizedMessage.includes('password')) {
    return 'A senha nao atende aos requisitos de seguranca.';
  }

  if (normalizedMessage.includes('rate limit') || normalizedMessage.includes('too many')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }

  if (normalizedMessage.includes('otp') || normalizedMessage.includes('challenge')) {
    return 'O codigo informado e invalido ou expirou.';
  }

  return 'Nao foi possivel concluir a autenticacao agora.';
}
