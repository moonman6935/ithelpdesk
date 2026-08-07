from __future__ import annotations

import json
import logging
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from config import BASE_DIR, load_settings
from parser import message_fingerprint, parse_request
from rocketchat_browser import ChatMessage, RocketChatBrowser
from state import StateStore

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("helpdesk-bot")


def load_templates() -> dict[str, str]:
    path = BASE_DIR / "templates" / "tr.json"
    return json.loads(path.read_text(encoding="utf-8"))


def run_powershell(script: Path, *args: str) -> subprocess.CompletedProcess[str]:
    command = [
        "powershell",
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        str(script),
        *args,
    ]
    return subprocess.run(command, capture_output=True, text=True, encoding="utf-8")


def write_log(log_dir: Path, name: str, payload: dict) -> None:
    log_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    path = log_dir / f"{stamp}-{name}.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def is_bot_message(message: ChatMessage, bot_name: str) -> bool:
    author = message.author.strip().lower()
    return bot_name.strip().lower() in author or author.startswith("it bot")


def handle_ticket(
    rc: RocketChatBrowser,
    templates: dict[str, str],
    settings,
    message: ChatMessage,
) -> None:
    parsed = parse_request(message.text)
    if not parsed:
        return

    if settings.audio_keywords_only and not parsed.is_audio_related:
        rc.send_message(templates["skipped_scope"])
        return

    rc.send_message(templates["ack"].format(id=parsed.normalized_id))
    rc.send_message(templates["in_progress"])

    connect = run_powershell(
        BASE_DIR / "anydesk.ps1",
        "-AnyDeskId",
        parsed.normalized_id,
        "-Action",
        "connect",
        "-AnyDeskExe",
        settings.anydesk_exe,
        "-ConnectTimeoutSec",
        str(settings.anydesk_connect_timeout_sec),
    )

    if connect.returncode != 0:
        detail = (connect.stderr or connect.stdout or "baglanti hatasi").strip()
        rc.send_message(templates["connect_failed"])
        raise RuntimeError(detail)

    repair = run_powershell(
        BASE_DIR / "remote_repair.ps1",
        "-HeadsetRepairPs1Url",
        settings.headset_repair_ps1_url,
        "-RepairWaitSec",
        str(settings.remote_repair_wait_sec),
    )
    if repair.returncode != 0:
        detail = (repair.stderr or repair.stdout or "uzak onarim hatasi").strip()
        run_powershell(BASE_DIR / "anydesk.ps1", "-Action", "disconnect")
        rc.send_message(templates["error"].format(reason=detail))
        raise RuntimeError(detail)

    run_powershell(
        BASE_DIR / "anydesk.ps1",
        "-Action",
        "disconnect",
        "-AnyDeskExe",
        settings.anydesk_exe,
    )
    rc.send_message(templates["done"])


def main() -> int:
    settings = load_settings()
    templates = load_templates()
    state = StateStore(settings.state_file)
    rc = RocketChatBrowser(settings)

    logger.info("Bot baslatiliyor. Kanal: %s", settings.channel_url)
    logger.info("Chrome CDP: %s", settings.cdp_url)

    try:
        rc.connect()
        rc.wait_ready()
        logger.info("Dinleme basladi. Rocket.Chat sekmesini acik birakin.")

        while True:
            try:
                rc.keepalive()
                for message in rc.poll_new_messages():
                    if is_bot_message(message, settings.bot_display_name):
                        continue
                    if not parse_request(message.text):
                        continue

                    fingerprint = message_fingerprint(message.author, message.text)
                    if state.is_processed(fingerprint):
                        continue

                    logger.info("Yeni talep: %s | %s", message.author, message.text[:120])
                    parsed = parse_request(message.text)
                    try:
                        handle_ticket(rc, templates, settings, message)
                        state.mark_processed(
                            fingerprint,
                            {
                                "author": message.author,
                                "anydesk_id": parsed.normalized_id if parsed else None,
                                "status": "done",
                            },
                        )
                    except Exception as exc:
                        logger.exception("Talep islenemedi")
                        state.mark_processed(
                            fingerprint,
                            {
                                "author": message.author,
                                "status": "failed",
                                "error": str(exc),
                            },
                        )
                        write_log(
                            settings.log_dir,
                            "failed",
                            {
                                "author": message.author,
                                "text": message.text,
                                "error": str(exc),
                            },
                        )
            except Exception:
                logger.exception("Dongu hatasi, tekrar denenecek...")
                time.sleep(5)

            time.sleep(settings.poll_interval_sec)
    except KeyboardInterrupt:
        logger.info("Bot durduruldu.")
        return 0
    finally:
        rc.close()


if __name__ == "__main__":
    sys.exit(main())
