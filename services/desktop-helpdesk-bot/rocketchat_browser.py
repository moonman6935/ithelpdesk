from __future__ import annotations

import logging
from dataclasses import dataclass

from playwright.sync_api import Browser, Page, Playwright, sync_playwright

from config import Settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class ChatMessage:
    author: str
    text: str


class RocketChatBrowser:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self._playwright: Playwright | None = None
        self._browser: Browser | None = None
        self._page: Page | None = None
        self._seen_keys: set[str] = set()

    def connect(self) -> None:
        self._playwright = sync_playwright().start()
        self._browser = self._playwright.chromium.connect_over_cdp(self.settings.cdp_url)
        self._page = self._find_or_open_channel_page()
        self._prime_seen_messages()
        logger.info("Rocket.Chat sayfasi hazir: %s", self._page.url)

    def close(self) -> None:
        if self._browser:
            try:
                self._browser.close()
            except Exception:
                pass
        if self._playwright:
            self._playwright.stop()

    def _find_or_open_channel_page(self) -> Page:
        assert self._browser is not None
        channel_hint = self.settings.rocketchat_channel.replace(" ", "").lower()
        for context in self._browser.contexts:
            for page in context.pages:
                url = page.url.lower()
                normalized = url.replace("_", "").replace("-", "")
                if "rocket" in url and channel_hint.lower().replace("_", "") in normalized:
                    page.bring_to_front()
                    return page

        if not self._browser.contexts or not self._browser.contexts[0].pages:
            raise RuntimeError(
                "Chrome'da acik sekme bulunamadi. Once Rocket.Chat'e giris yapip "
                f"{self.settings.channel_url} kanalini acin."
            )

        page = self._browser.contexts[0].pages[0]
        page.bring_to_front()
        page.goto(self.settings.channel_url, wait_until="domcontentloaded")
        page.wait_for_timeout(3000)
        return page

    def _first_selector(self, selectors: list[str]) -> str:
        return ", ".join(selectors)

    def _prime_seen_messages(self) -> None:
        for message in self._read_visible_messages():
            self._seen_keys.add(self._message_key(message))

    def _message_key(self, message: ChatMessage) -> str:
        return f"{message.author.strip().lower()}|{message.text.strip()}"

    def _read_visible_messages(self) -> list[ChatMessage]:
        assert self._page is not None
        page = self._page
        page.wait_for_timeout(500)

        script = """
        ({ messageSel, bodySel, userSel }) => {
          const nodes = Array.from(document.querySelectorAll(messageSel));
          const out = [];
          for (const node of nodes) {
            const body = node.querySelector(bodySel);
            const text = (body?.innerText || node.innerText || "").trim();
            if (!text) continue;

            let author = "";
            const userNode =
              node.querySelector(userSel) ||
              node.querySelector('[data-qa="message-name"]') ||
              node.querySelector('.rcx-message-header__name');
            if (userNode) {
              author = (userNode.innerText || "").trim();
            } else {
              const header = (node.innerText || "").split("\\n")[0] || "";
              author = header.trim();
            }
            out.push({ author, text });
          }
          return out;
        }
        """
        raw = page.evaluate(
            script,
            {
                "messageSel": self._first_selector(self.settings.rc_message_selector),
                "bodySel": self._first_selector(self.settings.rc_message_body_selector),
                "userSel": self._first_selector(self.settings.rc_message_user_selector),
            },
        )
        messages: list[ChatMessage] = []
        for item in raw:
            author = str(item.get("author", "")).strip()
            text = str(item.get("text", "")).strip()
            if not text:
                continue
            if author and text.startswith(author):
                text = text[len(author) :].strip(" :\n")
            messages.append(ChatMessage(author=author, text=text))
        return messages

    def poll_new_messages(self) -> list[ChatMessage]:
        fresh: list[ChatMessage] = []
        for message in self._read_visible_messages():
            key = self._message_key(message)
            if key in self._seen_keys:
                continue
            self._seen_keys.add(key)
            fresh.append(message)
        return fresh

    def send_message(self, text: str) -> None:
        assert self._page is not None
        page = self._page
        page.bring_to_front()

        input_selector = self._first_selector(self.settings.rc_input_selector)
        page.wait_for_selector(input_selector, timeout=15000)
        page.click(input_selector)
        page.fill(input_selector, text)

        send_selector = self._first_selector(self.settings.rc_send_selector)
        send_button = page.query_selector(send_selector)
        if send_button:
            send_button.click()
        else:
            page.keyboard.press("Enter")

        page.wait_for_timeout(800)
        self._seen_keys.add(
            self._message_key(ChatMessage(self.settings.bot_display_name, text))
        )
        logger.info("Mesaj gonderildi: %s", text)

    def wait_ready(self) -> None:
        assert self._page is not None
        self._page.wait_for_selector(
            self._first_selector(self.settings.rc_input_selector),
            timeout=30000,
        )

    def keepalive(self) -> None:
        assert self._page is not None
        try:
            self._page.evaluate("1")
        except Exception:
            logger.warning("Sayfa yeniden baglaniyor...")
            self._page = self._find_or_open_channel_page()
            self._prime_seen_messages()
