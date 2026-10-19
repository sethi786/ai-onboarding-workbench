type ProviderError = { code?: string; status?: number; name?: string };
function details(error: unknown): ProviderError {
  return error && typeof error === 'object' ? (error as ProviderError) : {};
}

export function isAuthServiceError(error: unknown) {
  const value = details(error);
  return (
    value.status === 0 ||
    (value.status ?? 0) >= 500 ||
    value.name === 'AuthRetryableFetchError' ||
    value.code === 'request_timeout'
  );
}

export function needsEmailConfirmation(error: unknown) {
  return details(error).code === 'email_not_confirmed';
}

/** Give customers a recovery action without exposing provider internals. */
export function authErrorMessage(error: unknown, fallback: string) {
  if (isAuthServiceError(error))
    return 'The account service is temporarily unavailable. Your details are still here; please try again shortly.';
  switch (details(error).code) {
    case 'invalid_credentials':
      return 'The email or password is incorrect. Check your details or reset your password.';
    case 'email_not_confirmed':
      return 'Please confirm your email before signing in. You can request a new confirmation link below.';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Too many attempts. Please wait a minute before trying again.';
    case 'weak_password':
      return 'Choose a stronger password with at least 8 characters.';
    case 'same_password':
      return 'Choose a password you have not used for this account before.';
    case 'signup_disabled':
      return 'New accounts are temporarily unavailable. Existing customers can still sign in.';
    case 'email_address_not_authorized':
      return 'Email delivery is not available for this address yet. Please contact support.';
    default:
      return fallback;
  }
}
