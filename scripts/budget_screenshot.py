#!/usr/bin/env python3
"""
budget_screenshot.py
Takes a screenshot of the Anthropic credit balance page and appends it
to Budget.md every hour from March 6 5pm to March 8 noon (hackathon window).

One-time setup required:
  python3 scripts/budget_screenshot.py --setup
"""

import sys
import os
import re
from datetime import datetime, timezone
from pathlib import Path

PROJECT_DIR  = Path("/Users/renatosgafilho/Projects/KOOKY/Doppio")
AUTH_FILE    = PROJECT_DIR / "scripts" / "budget_auth.json"
SCREENSHOTS  = PROJECT_DIR / "screenshots"
BUDGET_FILE  = PROJECT_DIR / "Budget.md"
TARGET_URL   = "https://platform.claude.com/settings/billing"
LOG_FILE     = PROJECT_DIR / "scripts" / "budget_screenshot.log"

# Hackathon window (local time)
WINDOW_START = datetime(2026, 3, 6, 17, 0, 0)   # March 6 at 5pm
WINDOW_END   = datetime(2026, 3, 8, 12, 0, 0)   # March 8 at noon

def log(msg):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def within_window():
    now = datetime.now()
    return WINDOW_START <= now <= WINDOW_END

def auto_unload():
    """Unload the launchd job once the hackathon window has closed."""
    plist = Path.home() / "Library/LaunchAgents/com.kooky.doppio.budget.plist"
    if plist.exists():
        os.system(f"launchctl unload {plist}")
        log("Hackathon window closed. LaunchD job unloaded automatically.")

def run_setup():
    """Interactive one-time login — saves cookies to budget_auth.json."""
    from playwright.sync_api import sync_playwright
    print("\n=== DOPPIO BUDGET — ONE-TIME AUTH SETUP ===")
    print(f"A browser will open. Log in to {TARGET_URL}.")
    print("Once the balance page is visible, press ENTER here to save auth.\n")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False, channel="chrome")
        ctx = browser.new_context()
        page = ctx.new_page()
        page.goto(TARGET_URL)
        input(">>> Press ENTER once you are logged in and can see the balance...")
        ctx.storage_state(path=str(AUTH_FILE))
        browser.close()
    print(f"\n✓ Auth saved to {AUTH_FILE}")
    print("You can now run the script normally (or wait for launchd to run it).\n")

def take_screenshot():
    from playwright.sync_api import sync_playwright

    if not AUTH_FILE.exists():
        log("ERROR: Auth file not found. Run: python3 scripts/budget_screenshot.py --setup")
        sys.exit(1)

    now = datetime.now()
    timestamp_str  = now.strftime("%Y-%m-%d_%H-%M")
    display_time   = now.strftime("%B %-d, %Y at %-I:%M %p")
    screenshot_path = SCREENSHOTS / f"budget_{timestamp_str}.png"

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, channel="chrome")
        ctx = browser.new_context(
            storage_state=str(AUTH_FILE),
            viewport={"width": 1280, "height": 900},
        )
        page = ctx.new_page()

        log(f"Navigating to {TARGET_URL}")
        page.goto(TARGET_URL, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_timeout(3000)  # let JS render billing data

        # Try to extract the balance value for the log
        balance_text = "unknown"
        try:
            # Look for dollar amount — typically a large text element
            amount_el = page.locator("text=/\\$[\\d,]+\\.\\d{2}/").first
            amount_el.wait_for(timeout=5000)
            balance_text = amount_el.text_content().strip()
        except Exception:
            pass

        # Crop to the credit balance card — find the balance element and walk up to its container
        try:
            balance_el = page.locator("text=/\\$[\\d,]+\\.\\d{2}/").first
            balance_el.wait_for(timeout=8000)
            container_box = balance_el.evaluate("""el => {
                let p = el;
                for (let i = 0; i < 5; i++) {
                    p = p.parentElement;
                    if (!p) break;
                    const r = p.getBoundingClientRect();
                    if (r.width > 200) return {x: r.x, y: r.y, width: r.width, height: r.height};
                }
                return null;
            }""")
            if container_box:
                pad = 24
                clip = {
                    "x":      max(0, container_box["x"] - pad),
                    "y":      max(0, container_box["y"] - 40),   # extra top for title
                    "width":  container_box["width"]  + pad * 2,
                    "height": container_box["height"] + 40 + pad,
                }
                page.screenshot(path=str(screenshot_path), clip=clip)
            else:
                raise ValueError("no container")
        except Exception:
            page.screenshot(path=str(screenshot_path), full_page=False)

        browser.close()

    log(f"Screenshot saved: {screenshot_path.name} | Balance: {balance_text}")

    # Append entry to Budget.md
    rel_screenshot = f"screenshots/budget_{timestamp_str}.png"
    entry = (
        f"\n---\n\n"
        f"### {display_time}\n\n"
        f"**Balance:** {balance_text}\n\n"
        f"![Credit Balance {display_time}]({rel_screenshot})\n"
    )

    with open(BUDGET_FILE, "a") as f:
        f.write(entry)

    log(f"Budget.md updated with balance: {balance_text}")
    return balance_text

def main():
    if "--setup" in sys.argv:
        run_setup()
        return

    now = datetime.now()

    # Auto-unload if hackathon is over
    if now > WINDOW_END:
        log("Outside hackathon window (after March 8 noon). Unloading job.")
        auto_unload()
        return

    # Silently exit if before window start (e.g. launchd fires at 3pm)
    if now < WINDOW_START:
        log(f"Before window start ({WINDOW_START.strftime('%-I:%M %p')}). Skipping.")
        return

    take_screenshot()

if __name__ == "__main__":
    main()
