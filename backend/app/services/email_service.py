import resend
from app.core.config import settings
from app.core.logging import logger


class EmailService:
    @staticmethod
    def send_otp_email(to_email: str, otp_code: str, recipient_name: str) -> bool:
        """
        Send OTP verification email via Resend.com API.
        Falls back to logging if EMAILS_ENABLED is False or RESEND_API_KEY is not set.
        """
        subject = f"Your Ashmora CityMind Verification Code: {otp_code}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }}
                .container {{ max-width: 550px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; }}
                .brand {{ font-size: 13px; font-weight: 700; color: #38bdf8; letter-spacing: 2px; text-transform: uppercase; }}
                .logo-bar {{ display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }}
                .logo-icon {{ width: 36px; height: 36px; background: #0284c7; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; }}
                h2 {{ color: #ffffff; font-size: 22px; margin: 0 0 8px 0; }}
                p {{ color: #94a3b8; font-size: 14px; line-height: 1.6; }}
                .otp-container {{ background: #0f172a; border: 2px solid #0284c7; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }}
                .otp-code {{ font-size: 40px; font-weight: 700; letter-spacing: 10px; color: #38bdf8; font-family: 'Courier New', monospace; }}
                .otp-label {{ font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px; }}
                .warning {{ background: #1e293b; border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 6px; margin: 16px 0; }}
                .warning p {{ color: #fbbf24; font-size: 13px; margin: 0; }}
                .footer {{ font-size: 11px; color: #475569; margin-top: 28px; text-align: center; border-top: 1px solid #334155; padding-top: 16px; line-height: 1.8; }}
                .badge {{ display: inline-block; background: #0284c7; color: white; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 20px; letter-spacing: 1px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo-bar">
                    <div class="logo-icon">C</div>
                    <div class="brand">Ashmora CityMind AI</div>
                    <span class="badge">SECURE</span>
                </div>

                <h2>Email Verification Code</h2>
                <p>Hello <strong style="color:#e2e8f0">{recipient_name}</strong>,</p>
                <p>Use the one-time verification code below to complete your authentication. 
                This code expires in <strong style="color:#f8fafc">10 minutes</strong>.</p>

                <div class="otp-container">
                    <div class="otp-code">{otp_code}</div>
                    <div class="otp-label">One-Time Password (OTP)</div>
                </div>

                <div class="warning">
                    <p>&#9888; Never share this code with anyone. Ashmora staff will never ask for your OTP.</p>
                </div>

                <p style="font-size:13px; color:#64748b;">
                    If you did not request this code, you can safely ignore this email. 
                    Your account remains secure.
                </p>

                <div class="footer">
                    <strong style="color:#94a3b8">Ashmora Technologies Inc.</strong><br/>
                    Building the Intelligence Behind Tomorrow.<br/>
                    <em>One City. One Intelligence. Infinite Possibilities.</em><br/><br/>
                    This is an automated security message — please do not reply.
                </div>
            </div>
        </body>
        </html>
        """

        # --- Fallback: log OTP if email not enabled ---
        if not settings.EMAILS_ENABLED or not settings.RESEND_API_KEY:
            logger.info(
                f"[EMAIL DISABLED] OTP for {to_email}: {otp_code} "
                f"(Set EMAILS_ENABLED=true and RESEND_API_KEY in environment to enable real emails)"
            )
            return True

        # --- Send via Resend.com API ---
        try:
            resend.api_key = settings.RESEND_API_KEY

            params: resend.Emails.SendParams = {
                "from": f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>",
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }

            response = resend.Emails.send(params)
            email_id = response.get("id", "unknown")
            logger.info(f"OTP email sent via Resend to {to_email} | email_id={email_id}")
            return True

        except Exception as e:
            logger.error(f"Resend failed for {to_email}: {e}")
            logger.info(f"[FALLBACK] OTP for {to_email}: {otp_code}")
            return False
