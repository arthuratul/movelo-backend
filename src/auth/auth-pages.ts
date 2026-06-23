function e(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

const CSS = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;font-size:16px;color-scheme:light}
  body{font-family:'Inter',ui-sans-serif,system-ui,-apple-system,sans-serif;background:#F9FAFB;color:#111827;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:1.5rem 1rem;line-height:1.5}
  a,button,[role=button]{transition:color .15s ease,background-color .15s ease,border-color .15s ease,box-shadow .15s ease,opacity .15s ease}
  :focus-visible{outline:2px solid #FF6B00;outline-offset:2px;border-radius:6px}
  .card{background:#fff;border-radius:24px;box-shadow:0 2px 8px 0 rgb(0 0 0/.06),0 0 1px 0 rgb(0 0 0/.08);padding:2rem;width:100%;max-width:420px;overflow:hidden}
  .brand{display:flex;align-items:center;gap:.5rem;margin-bottom:1.75rem}
  .brand-icon{width:36px;height:36px;background:#FF6B00;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}
  .brand-name{font-size:1.25rem;font-weight:700;letter-spacing:-.025em;color:#111827}
  .brand-name span{color:#FF6B00}
  h1{font-size:1.5rem;line-height:1.3;font-weight:600;letter-spacing:-.01em;color:#111827;margin-bottom:.375rem}
  .subtitle{font-size:.875rem;color:#6B7280;margin-bottom:1.75rem;line-height:1.5}
  .alert{background:#FEE2E2;border:1px solid rgba(220,38,38,.2);border-radius:14px;padding:.75rem 1rem;margin-bottom:1.25rem;display:flex;align-items:flex-start;gap:.625rem}
  .alert-icon{font-size:.875rem;flex-shrink:0;padding-top:1px}
  .alert-text{font-size:.8125rem;font-weight:500;color:#B91C1C}
  .field{margin-bottom:1.1rem}
  label{display:block;font-size:.875rem;font-weight:500;color:#374151;margin-bottom:.375rem}
  .input{width:100%;height:48px;padding:0 1rem;font-size:.875rem;font-family:inherit;background:#fff;border:1px solid #E5E7EB;border-radius:14px;color:#111827;outline:none;transition:border-color .15s ease,box-shadow .15s ease}
  .input::placeholder{color:#9CA3AF}
  .input:focus{border-color:#FF6B00;box-shadow:0 0 0 3px rgba(255,107,0,.12)}
  .input-error{border-color:#DC2626}
  .input-error:focus{border-color:#DC2626;box-shadow:0 0 0 3px rgba(220,38,38,.12)}
  .btn{display:flex;align-items:center;justify-content:center;width:100%;height:56px;margin-top:.25rem;padding:0 2rem;font-size:1rem;font-family:inherit;font-weight:600;color:#fff;background:#FF6B00;border:none;border-radius:18px;cursor:pointer;box-shadow:0 4px 12px 0 rgba(255,107,0,.28);letter-spacing:-.01em}
  .btn:hover{background:#E55F00;box-shadow:0 4px 16px 0 rgba(255,107,0,.42)}
  .btn:active{background:#CC5400;transform:scale(.97)}
  hr{border:none;border-top:1px solid #F3F4F6;margin:1.5rem 0 1.25rem}
  .footer{text-align:center;font-size:.75rem;color:#9CA3AF;line-height:1.5}
  .info-card{background:#fff;border-radius:24px;box-shadow:0 2px 8px 0 rgb(0 0 0/.06),0 0 1px 0 rgb(0 0 0/.08);padding:2rem;width:100%;max-width:420px;text-align:center}
  .info-card h1{font-size:1.25rem;margin-bottom:.5rem}
  .info-card p{font-size:.875rem;color:#6B7280;line-height:1.6}
`;

const HEAD = (title: string) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${e(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>`;

interface LoginParams {
  client_id: string;
  redirect_uri: string;
  code_challenge: string;
  code_challenge_method: string;
  state?: string;
}

export function renderLoginPage(
  params: LoginParams,
  clientName: string,
  error: string | null,
): string {
  const inputClass = error !== null ? 'input input-error' : 'input';
  const alertHtml =
    error !== null
      ? `<div class="alert"><span class="alert-icon">⚠️</span><span class="alert-text">${e(error)}</span></div>`
      : '';

  return `${HEAD(`Sign in – ${clientName}`)}
<div class="card">
  <div class="brand">
    <div class="brand-icon">🛵</div>
    <div class="brand-name">move<span>lo</span></div>
  </div>

  <h1>Sign in</h1>
  <p class="subtitle">Welcome back. Enter your credentials to continue.</p>

  ${alertHtml}

  <form method="POST" action="/auth/login">
    <input type="hidden" name="client_id"             value="${e(params.client_id)}">
    <input type="hidden" name="redirect_uri"          value="${e(params.redirect_uri)}">
    <input type="hidden" name="code_challenge"        value="${e(params.code_challenge)}">
    <input type="hidden" name="code_challenge_method" value="${e(params.code_challenge_method)}">
    ${params.state ? `<input type="hidden" name="state" value="${e(params.state)}">` : ''}

    <div class="field">
      <label for="email">Email</label>
      <input class="${inputClass}" type="email" id="email" name="email"
             required autofocus placeholder="you@example.com">
    </div>

    <div class="field">
      <label for="password">Password</label>
      <input class="${inputClass}" type="password" id="password" name="password"
             required placeholder="Enter your password" minlength="8">
    </div>

    <button class="btn" type="submit">Sign in</button>
  </form>

  <hr>
  <p class="footer">Your credentials are handled securely and never shared with third-party apps.</p>
</div>
</body>
</html>`;
}

export function renderErrorPage(message: string): string {
  return `${HEAD('Authorization Error – Movelo')}
<div class="info-card">
  <div class="brand" style="justify-content:center">
    <div class="brand-icon">🛵</div>
    <div class="brand-name">move<span>lo</span></div>
  </div>
  <h1>Something went wrong</h1>
  <p>${e(message)}<br>Return to the app and try signing in again.</p>
</div>
</body>
</html>`;
}
