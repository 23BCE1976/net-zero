const resetPwdTemplate = ({ name, otp }) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Reset Your Password</title>
  </head>

  <body style="margin:0; padding:0; background:#f4f6f8; font-family:Arial, Helvetica, sans-serif;">

    <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#dc2626,#ef4444); padding:30px 20px; text-align:center; color:#ffffff;">
        <h1 style="margin:0; font-size:24px;">Password Reset Request</h1>
      </div>

      <!-- Content -->
      <div style="padding:40px 30px; color:#333333;">

        <h2 style="margin-top:0;">Hello ${name},</h2>

        <p style="font-size:16px; line-height:1.6;">
          We received a request to reset your password. Use the OTP below to proceed.
        </p>

        <!-- OTP BOX -->
        <div style="text-align:center; margin:30px 0;">
          <div style="
            display:inline-block;
            background:#f3f4f6;
            padding:18px 30px;
            font-size:28px;
            letter-spacing:6px;
            font-weight:bold;
            color:#dc2626;
            border-radius:8px;
            border:2px dashed #ef4444;
          ">
            ${otp}
          </div>
        </div>

        <p style="font-size:15px; line-height:1.6;">
          This OTP is valid for a limited time. Please do not share it with anyone.
        </p>

        <p style="font-size:15px; line-height:1.6;">
          If you didn’t request a password reset, you can safely ignore this email.
        </p>

      </div>

      <!-- Footer -->
      <div style="background:#f9fafb; padding:20px; text-align:center; font-size:12px; color:#888888;">
        <p style="margin:0;">For security reasons, this OTP will expire shortly.</p>
        <p style="margin:5px 0 0;">© ${new Date().getFullYear()} Your Company</p>
      </div>

    </div>

  </body>
</html>
`;

export default resetPwdTemplate;
