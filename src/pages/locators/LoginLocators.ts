/**
 * LoginLocators — Brook landing page + Auth0 login form.
 *
 * Rules:
 *  - No logic, no imports, no helper calls.
 *  - Priority: getByRole → getByLabel → getByText → getByTestId → CSS (last resort).
 *  - No XPath.
 *  - `as const` ensures full autocomplete and prevents accidental mutation.
 *
 * NOTE: The error message is a plain <div> in Auth0 — not role=alert.
 *       Use page.getByText(LoginLocators.errorMessage) in the page class.
 */
export const LoginLocators = {
  // Brook landing page — the button that redirects to Auth0
  landingLoginButton: { role: 'button'  as const, name: 'Login' },

  // Auth0 login form
  emailInput:    { role: 'textbox' as const, name: 'Email address' },
  passwordInput: { role: 'textbox' as const, name: 'Password' },
  submitButton:  { role: 'button'  as const, name: 'Continue', exact: true },
  errorMessage:  'Wrong email or password',
} as const;
