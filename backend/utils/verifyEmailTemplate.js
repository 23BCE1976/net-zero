const verifyEmailTemplate = ({ name, link }) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Verify Email</title>
  </head>

  <body style="margin:0; padding:0; background:#f4f6f8; font-family:Arial, sans-serif;">

    <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed); padding:30px; text-align:center; color:white;">
        <h1 style="margin:0; font-size:24px;">Verify Your Email</h1>
      </div>

      <!-- Content -->
      <div style="padding:40px 30px; color:#333;">

        <h2 style="margin-top:0;">Hello ${name},</h2>

        <p style="font-size:16px; line-height:1.6;">
          Thanks for signing up! Please confirm your email address by clicking the button below.
        </p>

        <p style="font-size:16px; line-height:1.6;">
          This helps us keep your account secure.
        </p>

        <!-- Button -->
        <div style="text-align:center; margin:30px 0;">
          <a href="${link}"
             style="
               display:inline-block;
               background:linear-gradient(135deg,#4f46e5,#7c3aed);
               color:#ffffff;
               text-decoration:none;
               padding:14px 28px;
               font-size:16px;
               border-radius:6px;
               font-weight:bold;
             ">
            Verify Email
          </a>
        </div>

        <p style="font-size:14px; color:#666;">
          If the button doesn't work, copy and paste this link into your browser:
        </p>

        <p style="font-size:14px; word-break:break-all;">
          <a href="${link}" style="color:#4f46e5;">${link}</a>
        </p>

      </div>

      <!-- Footer -->
      <div style="background:#f9fafb; padding:20px; text-align:center; font-size:12px; color:#888;">
        <p style="margin:0;">If you didn’t create an account, you can safely ignore this email.</p>
        <p style="margin:5px 0 0;">&copy; ${new Date().getFullYear()} Net Zero</p>
      </div>

    </div>

  </body>
</html>
`;

export default verifyEmailTemplate;
