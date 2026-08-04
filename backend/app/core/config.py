import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Ashmora CityMind AI"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "ashmora-citymind-ai-super-secret-jwt-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    DATABASE_URL: str = "sqlite+aiosqlite:///./citymind.db"

    GEMINI_API_KEY: str = ""

    # Email OTP — Resend.com (https://resend.com — free 3k emails/month)
    EMAILS_ENABLED: bool = False
    RESEND_API_KEY: str = ""
    EMAILS_FROM_EMAIL: str = "noreply@ashmora.gov"
    EMAILS_FROM_NAME: str = "Ashmora CityMind Security"

    CORS_ORIGINS: Union[List[str], str] = ["*"]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("["):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",")]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )


settings = Settings()
