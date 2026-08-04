import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
from app.core.logging import logger


class EmailService:
    @staticmethod
    def send_otp_email(to_email: str, otp_code: str, recipient_name: str) -> bool:
        subject = f"Your Ashmora CityMind AI Verification Code: {otp_code}"
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }}
                .container {{ max-width: 550px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 32px; border: 1px solid #334155; }}
                .brand {{ font-size: 20px; font-weight: bold; color: #38bdf8; letter-spacing: 1px; }}
                .otp-box {{ background: #0f172a; border: 2px solid #0284c7; font-size: 36px; font-weight: font-mono; font-weight: bold; letter-spacing: 8px; color: #38bdf8; text-align: center; padding: 16px; border-radius: 12px; margin: 24px 0; }}
                .footer {{ font-size: 11px; color: #64748b; margin-top: 24px; text-align: center; border-top: 1px solid #334155; padding-top: 16px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="brand">ASHMORA CityMind AI</div>
                <h2 style="color: #ffffff; margin-top: 16px;">Security Verification Code</h2>
                <p style="color: #94a3b8; font-size: 14px;">Hello {recipient_name},</p>
                <p style="color: #94a3b8; font-size: 14px;">Use the 6-digit One-Time Password (OTP) below to verify your account. This code is valid for <strong>10 minutes</strong>.</p>
                
                <div class="otp-box">{otp_code}</div>

                <p style="color: #94a3b8; font-size: 13px;">If you did not request this verification code, please ignore this email.</p>

                <div class="footer">
                    Ashmora Technologies Inc. — Building the Intelligence Behind Tomorrow.<br/>
                    One City. One Intelligence. Infinite Possibilities.
                </div>
            </div>
        </body>
        </html>
        """

        if not settings.EMAILS_ENABLED or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
            logger.info(f"[SMTP DISABLED/UNCONFIGURED] OTP Code for {to_email}: {otp_code}")
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
            msg["To"] = to_email

            part = MIMEText(html_content, "html")
            msg.attach(part)

            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            if settings.SMTP_TLS:
                server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAILS_FROM_EMAIL, [to_email], msg.as_string())
            server.quit()
            logger.info(f"Successfully sent OTP email to {to_email} via SMTP ({settings.SMTP_HOST})")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMTP email to {to_email}: {e}")
            logger.info(f"[FALLBACK LOG] OTP Code for {to_email}: {otp_code}")
            return False
