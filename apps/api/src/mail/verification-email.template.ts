export type VerificationEmailContext = {
  appName: string;
  code: string;
  purposeLabel: string;
};

export function buildVerificationEmailHtml(context: VerificationEmailContext): string {
  const { appName, code, purposeLabel } = context;
  const digits = code.split('').join(' ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${appName} verification code</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #e4e4e7;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 8px;text-align:center;background:linear-gradient(135deg,#7c3aed 0%,#2563eb 100%);">
              <p style="margin:0;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.85);">${appName}</p>
              <h1 style="margin:8px 0 0;font-size:22px;font-weight:700;color:#ffffff;">Your verification code</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#3f3f46;">Use this code to ${purposeLabel}. It expires in <strong>5 minutes</strong>.</p>
              <p style="margin:0 0 24px;text-align:center;font-size:32px;font-weight:700;letter-spacing:0.35em;color:#18181b;font-family:Consolas,Monaco,monospace;">${digits}</p>
              <p style="margin:0;font-size:13px;line-height:1.5;color:#71717a;">If you did not request this, you can ignore this email. Never share this code with anyone.</p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#a1a1aa;">&copy; ${new Date().getFullYear()} ${appName}</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildVerificationEmailText(context: VerificationEmailContext): string {
  return `${context.appName} verification code: ${context.code}\n\nUse this code to ${context.purposeLabel}. It expires in 5 minutes.\n\nIf you did not request this, ignore this email.`;
}
