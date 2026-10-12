"""Worker settings, read from the environment (or worker/.env). See worker/.env.example."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

SOURCE_FLAGS = (
    "jobspy",
    "adzuna",
    "internshala",
    "remoteok",
    "remotive",
    "himalayas",
    "arbeitnow",
    "weworkremotely",
    "greenhouse",
    "lever",
    "ashby",
    "workday",
    "smartrecruiters",
)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", env_ignore_empty=True
    )

    # Database / Supabase
    database_url: str | None = None
    supabase_url: str | None = None
    supabase_service_role_key: str | None = None

    # Gemini (model ids verified live; check Google's docs before changing)
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-3.5-flash-lite"
    gemini_embed_model: str = "gemini-embedding-2"
    gemini_tailor_model: str | None = None
    embed_dimensions: int = 768
    # Daily soft caps per request kind. Free-tier limits are only published in AI Studio
    # (aistudio.google.com/rate-limit), so these are conservative guesses: keep them below your quota.
    llm_daily_soft_cap_score: int = 150
    llm_daily_soft_cap_embed: int = 150
    llm_daily_soft_cap_tailor: int = 30
    llm_daily_soft_cap_parse: int = 20
    llm_daily_soft_cap_extract: int = 50
    llm_min_seconds_between_calls: float = 4.0  # <= 15 requests/minute

    # Telegram / app
    telegram_bot_token: str | None = None
    app_url: str = "http://localhost:3000"

    # Adzuna
    adzuna_app_id: str | None = None
    adzuna_app_key: str | None = None

    # Source flags (ENABLE_<SOURCE>)
    enable_jobspy: bool = True
    enable_adzuna: bool = True
    enable_internshala: bool = True
    enable_remoteok: bool = True
    enable_remotive: bool = True
    enable_himalayas: bool = True
    enable_arbeitnow: bool = True
    enable_weworkremotely: bool = True
    enable_greenhouse: bool = True
    enable_lever: bool = True
    enable_ashby: bool = True
    enable_workday: bool = True
    enable_smartrecruiters: bool = True
    # jobspy sites (LinkedIn: public listings only, low volume; never profiles/login/messaging)
    jobspy_sites: str = "linkedin,indeed,google,naukri,glassdoor"

    # Pipeline tuning
    score_top_k: int = 20
    score_batch_size: int = 5
    max_individual_alerts: int = 8
    source_timeout_seconds: float = 120.0
    tz: str = "Asia/Kolkata"

    @property
    def tailor_model(self) -> str:
        return self.gemini_tailor_model or self.gemini_model

    def source_enabled(self, name: str) -> bool:
        return bool(getattr(self, f"enable_{name}", False))

    def llm_cap(self, kind: str) -> int:
        return int(getattr(self, f"llm_daily_soft_cap_{kind}", 0))


@lru_cache
def get_settings() -> Settings:
    return Settings()
