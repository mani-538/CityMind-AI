import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

def send_otp_email(to_email: str, otp_code: str):
    """
    Sends an OTP email to the specified user.
    Reads SMTP configuration from settings (.env file).
    If no SMTP configuration is found, prints the OTP to the console (for local development).
    """
    smtp_host = settings.SMTP_HOST
    smtp_port = settings.SMTP_PORT
    smtp_user = settings.SMTP_USER
    smtp_password = settings.SMTP_PASSWORD
    from_email = settings.FROM_EMAIL

    if not smtp_host or not smtp_user or not smtp_password:
        logger.warning(f"SMTP credentials not fully configured. Falling back to console.")
        logger.info(f"OTP for {to_email}: {otp_code}")
        print(f"==========================================")
        print(f"EMAIL MOCK: To: {to_email}")
        print(f"Subject: Your CityMind Registration OTP")
        print(f"OTP Code: {otp_code}")
        print(f"==========================================")
        return

    subject = "Your CityMind Registration OTP"
    body = f"Hello,\n\nYour One-Time Password (OTP) for CityMind registration is: {otp_code}\n\nThis OTP will expire in 10 minutes.\n\nThank you,\nCityMind Team"

    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP(smtp_host, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_password)
        text = msg.as_string()
        server.sendmail(from_email, to_email, text)
        server.quit()
        logger.info(f"OTP email sent successfully to {to_email}")
    except Exception as e:
        logger.error(f"Failed to send OTP email: {str(e)}")
        raise e
