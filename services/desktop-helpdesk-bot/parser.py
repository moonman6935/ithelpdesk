from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass

ANYDESK_PATTERNS = [
    re.compile(
        r"(?i)(?:anydesk|any\s*desk|any)\s*[:\-]?\s*(\d[\d\s\-]{7,14}\d)",
        re.UNICODE,
    ),
    re.compile(r"\b(\d{3}[\s\-]?\d{3}[\s\-]?\d{3})\b"),
]

AUDIO_KEYWORDS = re.compile(
    r"(?i)(kulakl[iı]k|headset|ses|mikrofon|microphone|audio|sound|"
    r"duyam|duymuyor|sessiz|speaker|jabra|poly|logitech|handset)",
    re.UNICODE,
)


@dataclass(frozen=True)
class ParsedRequest:
    anydesk_id: str
    is_audio_related: bool
    normalized_id: str


def normalize_anydesk_id(raw: str) -> str:
    digits = re.sub(r"\D", "", raw)
    if len(digits) != 9:
        raise ValueError(f"Gecersiz AnyDesk ID: {raw!r}")
    return digits


def extract_anydesk_id(text: str) -> str | None:
    for pattern in ANYDESK_PATTERNS:
        match = pattern.search(text or "")
        if not match:
            continue
        candidate = match.group(1)
        try:
            return normalize_anydesk_id(candidate)
        except ValueError:
            continue
    return None


def is_audio_related(text: str) -> bool:
    return bool(AUDIO_KEYWORDS.search(text or ""))


def parse_request(text: str) -> ParsedRequest | None:
    anydesk_id = extract_anydesk_id(text)
    if not anydesk_id:
        return None
    return ParsedRequest(
        anydesk_id=anydesk_id,
        is_audio_related=is_audio_related(text),
        normalized_id=anydesk_id,
    )


def message_fingerprint(author: str, text: str) -> str:
    payload = f"{author.strip().lower()}|{text.strip()}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()
