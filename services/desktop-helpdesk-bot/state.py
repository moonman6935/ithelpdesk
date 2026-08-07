from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock


class StateStore:
    def __init__(self, path: Path) -> None:
        self.path = path
        self._lock = Lock()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if not self.path.exists():
            self._write({"processed": {}})

    def _read(self) -> dict:
        try:
            return json.loads(self.path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            return {"processed": {}}

    def _write(self, data: dict) -> None:
        self.path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def is_processed(self, fingerprint: str) -> bool:
        with self._lock:
            return fingerprint in self._read().get("processed", {})

    def mark_processed(self, fingerprint: str, meta: dict | None = None) -> None:
        with self._lock:
            data = self._read()
            processed = data.setdefault("processed", {})
            processed[fingerprint] = {
                "at": datetime.now(timezone.utc).isoformat(),
                **(meta or {}),
            }
            self._write(data)
