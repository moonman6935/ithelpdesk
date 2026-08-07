from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")


def _csv(value: str) -> list[str]:
    return [part.strip() for part in value.split(",") if part.strip()]


@dataclass(frozen=True)
class Settings:
    rocketchat_url: str
    rocketchat_channel: str
    cdp_url: str
    bot_display_name: str
    poll_interval_sec: int
    audio_keywords_only: bool
    anydesk_exe: str
    anydesk_connect_timeout_sec: int
    anydesk_password: str | None
    headset_repair_ps1_url: str
    remote_repair_wait_sec: int
    rc_message_selector: list[str]
    rc_message_body_selector: list[str]
    rc_message_user_selector: list[str]
    rc_input_selector: list[str]
    rc_send_selector: list[str]
    state_file: Path
    log_dir: Path

    @property
    def channel_url(self) -> str:
        base = self.rocketchat_url.rstrip("/")
        slug = self.rocketchat_channel.strip("#").replace(" ", "")
        return f"{base}/channel/{slug}"


def load_settings() -> Settings:
    return Settings(
        rocketchat_url=os.getenv("ROCKETCHAT_URL", "https://rocket.dmc-rz.com"),
        rocketchat_channel=os.getenv("ROCKETCHAT_CHANNEL", "IT_Helpdesk"),
        cdp_url=os.getenv("CDP_URL", "http://127.0.0.1:9222"),
        bot_display_name=os.getenv("BOT_DISPLAY_NAME", "IT Bot"),
        poll_interval_sec=int(os.getenv("POLL_INTERVAL_SEC", "8")),
        audio_keywords_only=os.getenv("AUDIO_KEYWORDS_ONLY", "true").lower()
        in {"1", "true", "yes", "on"},
        anydesk_exe=os.getenv(
            "ANYDESK_EXE", r"C:\Program Files (x86)\AnyDesk\AnyDesk.exe"
        ),
        anydesk_connect_timeout_sec=int(os.getenv("ANYDESK_CONNECT_TIMEOUT_SEC", "120")),
        anydesk_password=os.getenv("ANYDESK_PASSWORD") or None,
        headset_repair_ps1_url=os.getenv(
            "HEADSET_REPAIR_PS1_URL",
            "https://raw.githubusercontent.com/OWNER/ithelpdesk/main/tools/headset-repair/HeadsetRepair.ps1",
        ),
        remote_repair_wait_sec=int(os.getenv("REMOTE_REPAIR_WAIT_SEC", "90")),
        rc_message_selector=_csv(
            os.getenv("RC_MESSAGE_SELECTOR", '[data-qa="message"], .rcx-message')
        ),
        rc_message_body_selector=_csv(
            os.getenv(
                "RC_MESSAGE_BODY_SELECTOR",
                '[data-qa="message-body"], .rcx-message-body, .message-body',
            )
        ),
        rc_message_user_selector=_csv(
            os.getenv(
                "RC_MESSAGE_USER_SELECTOR",
                '[data-qa="message-header"], .rcx-message-header__username',
            )
        ),
        rc_input_selector=_csv(
            os.getenv(
                "RC_INPUT_SELECTOR",
                '[data-qa="message-input"], textarea.rcx-message-box__input, .rcx-message-box textarea',
            )
        ),
        rc_send_selector=_csv(
            os.getenv(
                "RC_SEND_SELECTOR",
                '[data-qa="send"], button[aria-label*="Send"], button[aria-label*="Gonder"]',
            )
        ),
        state_file=BASE_DIR / "data" / "processed_messages.json",
        log_dir=BASE_DIR / "data" / "logs",
    )
