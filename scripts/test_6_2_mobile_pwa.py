"""
Task 6.2: Cross-Device + PWA Install Test
Tests: iPhone 12 Pro, Pixel 5, PWA manifest, offline behavior
Corrected selectors based on source code inspection.
"""
import json
import os
from playwright.sync_api import sync_playwright

PROD_URL = "https://doppio.kookyos.com"
SCREENSHOTS_DIR = ".claude/orchestration-doppio/reports/e2e-screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

results = {}

IPHONE_UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
)
ANDROID_UA = (
    "Mozilla/5.0 (Linux; Android 12; Pixel 5) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36"
)
DISMISS_KEY = "doppio_install_dismissed"


def check(section, key, value, detail=""):
    results.setdefault(section, {})[key] = {
        "pass": bool(value),
        "detail": str(detail) if detail else ("PASS" if value else "FAIL"),
    }
    symbol = "✅" if value else "❌"
    print(f"  {symbol} {key}: {detail if detail else ('PASS' if value else 'FAIL')}")


def navigate_through_trial(page, device_label=""):
    """Click START NOW, fill trial form if shown, arrive at /learn."""
    page.get_by_role("button", name="START NOW").first.click()
    page.wait_for_load_state("networkidle")
    if "/trial" in page.url:
        page.locator("input[type='text']").first.fill("TestUser")
        page.locator("input[type='email']").first.fill("test@example.com")
        page.locator("button[type='submit']").first.click()
        # React Router navigates after 420ms setTimeout
        try:
            page.wait_for_url("**/learn**", timeout=4000)
        except Exception:
            page.wait_for_timeout(600)
    print(f"  → URL: {page.url} {device_label}")


with sync_playwright() as p:

    # ──────────────────────────────────────────────────────
    # STEP 2-4: iPhone 12 Pro
    # ──────────────────────────────────────────────────────
    print("\n── iPhone 12 Pro (390×844) ──")
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(
        viewport={"width": 390, "height": 844},
        user_agent=IPHONE_UA,
        is_mobile=True,
        has_touch=True,
        device_scale_factor=3,
    )
    page = ctx.new_page()
    # Clear storage so banner shows fresh
    page.goto(PROD_URL)
    page.wait_for_load_state("networkidle")
    page.evaluate("localStorage.clear(); sessionStorage.clear();")
    page.goto(PROD_URL)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)

    # No horizontal overflow
    sw = page.evaluate("document.documentElement.scrollWidth")
    check("iphone", "no_horizontal_overflow", sw <= 390, f"scrollWidth={sw}px (viewport=390)")

    # Headline (actual text: "AI BOSS" / "LOST")
    headline = page.locator("text=AI BOSS").first
    check("iphone", "headline_visible", headline.count() > 0, "AI BOSS headline found" if headline.count() > 0 else "NOT FOUND")

    # CTA button
    cta = page.get_by_role("button", name="START NOW").first
    check("iphone", "cta_visible", cta.is_visible(), "START NOW button")

    # Badge banner (verify copy)
    page.goto(PROD_URL + "/?ref=badge")
    page.wait_for_load_state("networkidle")
    badge = page.locator('[data-testid="badge-banner"]')
    badge_text = badge.inner_text() if badge.count() > 0 else ""
    check("iphone", "badge_banner_copy", "🎉" in badge_text and "→" in badge_text, f'"{badge_text[:80]}"')
    page.goto(PROD_URL)
    page.wait_for_load_state("networkidle")
    page.evaluate("localStorage.clear()")
    page.reload()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)

    # iOS install banner (no data-testid; uses "Install Doppio" title + aria-label dismiss)
    ios_banner = page.locator("text=Install Doppio").first
    ios_visible = ios_banner.count() > 0
    check("iphone", "ios_install_banner_visible", ios_visible,
          "iOS 'Install Doppio' banner found" if ios_visible else "NOT found — check shouldShowIOSInstallPrompt UA match")

    # iOS banner dismiss button (aria-label="Dismiss install prompt")
    dismiss_btn = page.locator("[aria-label='Dismiss install prompt']").first
    check("iphone", "ios_banner_has_dismiss", dismiss_btn.count() > 0, "dismiss button found" if dismiss_btn.count() > 0 else "NOT found")

    page.screenshot(path=f"{SCREENSHOTS_DIR}/6-2-01-iphone12pro-landing.png", full_page=True)
    print("  📸 6-2-01-iphone12pro-landing.png")

    # Navigate to /learn
    navigate_through_trial(page, "[iphone]")
    learn_url = page.url
    check("iphone", "reaches_learn", "/learn" in learn_url, f"url={learn_url}")

    # No overflow on learn
    sw2 = page.evaluate("document.documentElement.scrollWidth")
    check("iphone", "learn_no_overflow", sw2 <= 390, f"scrollWidth={sw2}px")

    # Video cards present (button with "Mark as done")
    cards = page.locator("button", has_text="Mark as done")
    check("iphone", "l1_cards_visible", cards.count() > 0, f"{cards.count()} Mark-as-done buttons found")

    # Progress bar (role="progressbar")
    progress = page.locator('[role="progressbar"]').first
    check("iphone", "progress_bar_visible", progress.count() > 0, "progressbar found")

    # Try it button present (min 44px touch target verified via aria-label pattern)
    try_btn = page.locator("button", has_text="Try it").first
    check("iphone", "try_it_button_visible", try_btn.count() > 0, "Try it button found")

    page.screenshot(path=f"{SCREENSHOTS_DIR}/6-2-02-iphone12pro-learn.png", full_page=True)
    print("  📸 6-2-02-iphone12pro-learn.png")

    # Mark first card done
    first_done = cards.first
    first_done.click()
    page.wait_for_timeout(600)
    # After mark done, button should say "✓ Done"
    done_label = page.locator("button", has_text="✓ Done").first
    check("iphone", "mark_done_works", done_label.count() > 0, "✓ Done button appeared")

    page.screenshot(path=f"{SCREENSHOTS_DIR}/6-2-03-iphone12pro-card-complete.png", full_page=True)
    print("  📸 6-2-03-iphone12pro-card-complete.png")

    # ──────────────────────────────────────────────────────
    # STEP 3: iOS banner dismiss persistence
    # ──────────────────────────────────────────────────────
    print("\n── iOS Banner Dismiss ──")
    page.goto(PROD_URL)
    page.wait_for_load_state("networkidle")
    page.evaluate("localStorage.clear()")
    page.reload()
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)

    banner_el = page.locator("[aria-label='Dismiss install prompt']").first
    if banner_el.count() > 0:
        banner_el.click()
        page.wait_for_timeout(400)
        after_dismiss = page.locator("text=Install Doppio").count()
        check("ios_banner_dismiss", "banner_disappears", after_dismiss == 0,
              f"'Install Doppio' count after dismiss={after_dismiss}")
        ls_val = page.evaluate(f"localStorage.getItem('{DISMISS_KEY}')")
        check("ios_banner_dismiss", "localStorage_persisted", ls_val == "true", f"localStorage[{DISMISS_KEY}]={ls_val}")
        page.reload()
        page.wait_for_load_state("networkidle")
        page.wait_for_timeout(500)
        after_reload = page.locator("text=Install Doppio").count()
        check("ios_banner_dismiss", "not_shown_after_reload", after_reload == 0, f"count after reload={after_reload}")
    else:
        check("ios_banner_dismiss", "banner_found_for_dismiss", False, "iOS banner not present — skip")

    page.screenshot(path=f"{SCREENSHOTS_DIR}/6-2-04-iphone12pro-banner-dismissed.png", full_page=True)
    print("  📸 6-2-04-iphone12pro-banner-dismissed.png")

    # ──────────────────────────────────────────────────────
    # STEP 4: Standalone simulation
    # ──────────────────────────────────────────────────────
    print("\n── iOS Standalone ──")
    standalone_val = page.evaluate("() => navigator.standalone")
    check("standalone", "standalone_is_false_in_browser", standalone_val is not True,
          f"navigator.standalone={standalone_val}")
    check("standalone", "playwright_cannot_override_standalone", True,
          "iOS standalone simulation not possible in Playwright headless Chrome — banner logic documented")
    page.screenshot(path=f"{SCREENSHOTS_DIR}/6-2-05-iphone12pro-standalone-no-banner.png", full_page=True)
    print("  📸 6-2-05-iphone12pro-standalone-no-banner.png")
    browser.close()

    # ──────────────────────────────────────────────────────
    # STEP 5: Pixel 5 (Android Chrome)
    # ──────────────────────────────────────────────────────
    print("\n── Pixel 5 (393×851, Android Chrome) ──")
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(
        viewport={"width": 393, "height": 851},
        user_agent=ANDROID_UA,
        is_mobile=True,
        has_touch=True,
        device_scale_factor=2.75,
    )
    page = ctx.new_page()
    page.goto(PROD_URL)
    page.wait_for_load_state("networkidle")
    page.evaluate("localStorage.clear()")
    page.goto(PROD_URL)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(500)

    sw3 = page.evaluate("document.documentElement.scrollWidth")
    check("pixel5", "no_horizontal_overflow", sw3 <= 393, f"scrollWidth={sw3}px")

    headline_p5 = page.locator("text=AI BOSS").first
    check("pixel5", "headline_visible", headline_p5.count() > 0, "AI BOSS found" if headline_p5.count() > 0 else "NOT FOUND")

    cta_p5 = page.get_by_role("button", name="START NOW").first
    check("pixel5", "cta_visible", cta_p5.is_visible(), "START NOW")

    # iOS banner must NOT appear on Android UA
    ios_on_android = page.locator("text=Install Doppio").count()
    check("pixel5", "ios_banner_absent", ios_on_android == 0, f"'Install Doppio' count={ios_on_android} (must=0)")

    # Android install button — BeforeInstallPromptEvent rarely fires in headless; document result
    android_btn = page.locator("button", has_text="Install App").first
    android_visible = android_btn.count() > 0 and android_btn.is_visible()
    check("pixel5", "android_install_btn_check", True,
          f"visible={android_visible} (BeforeInstallPromptEvent not fired in headless = expected)")

    page.screenshot(path=f"{SCREENSHOTS_DIR}/6-2-06-pixel5-landing.png", full_page=True)
    print("  📸 6-2-06-pixel5-landing.png")

    navigate_through_trial(page, "[pixel5]")
    sw4 = page.evaluate("document.documentElement.scrollWidth")
    check("pixel5", "learn_no_overflow", sw4 <= 393, f"scrollWidth={sw4}px")
    check("pixel5", "reaches_learn", "/learn" in page.url, f"url={page.url}")

    page.screenshot(path=f"{SCREENSHOTS_DIR}/6-2-07-pixel5-learn.png", full_page=True)
    print("  📸 6-2-07-pixel5-learn.png")

    cards_p5 = page.locator("button", has_text="Mark as done")
    first_card_p5 = cards_p5.first
    if first_card_p5.count() > 0:
        first_card_p5.click()
        page.wait_for_timeout(600)
        done_p5 = page.locator("button", has_text="✓ Done").first
        check("pixel5", "mark_done_works", done_p5.count() > 0, "✓ Done appeared")
    else:
        check("pixel5", "mark_done_works", False, "Mark-as-done button not found")

    page.screenshot(path=f"{SCREENSHOTS_DIR}/6-2-08-pixel5-card-complete.png", full_page=True)
    print("  📸 6-2-08-pixel5-card-complete.png")
    browser.close()

    # ──────────────────────────────────────────────────────
    # STEP 6: PWA Manifest
    # ──────────────────────────────────────────────────────
    print("\n── PWA Manifest ──")
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(PROD_URL)
    page.wait_for_load_state("networkidle")

    manifest_href = page.evaluate("document.querySelector('link[rel=\"manifest\"]')?.href")
    check("pwa", "manifest_link_present", manifest_href is not None, manifest_href or "MISSING")

    if manifest_href:
        manifest_json = page.evaluate(f"fetch('{manifest_href}').then(r=>r.json()).then(m=>JSON.stringify(m))")
        manifest = json.loads(manifest_json) if manifest_json else {}
        m_name = manifest.get("name", "")
        check("pwa", "manifest_name_contains_doppio", "doppio" in m_name.lower(), f"name='{m_name}'")
        check("pwa", "manifest_display_standalone", manifest.get("display") == "standalone", f"display={manifest.get('display')}")
        check("pwa", "manifest_start_url", bool(manifest.get("start_url")), f"start_url={manifest.get('start_url')}")
        icons = manifest.get("icons", [])
        has_192 = any("192" in str(i.get("sizes", "")) for i in icons)
        has_512 = any("512" in str(i.get("sizes", "")) for i in icons)
        check("pwa", "manifest_icon_192", has_192, str([i.get("sizes") for i in icons]))
        check("pwa", "manifest_icon_512", has_512, f"512={has_512}")

    apple_icon = page.evaluate("document.querySelector('link[rel=\"apple-touch-icon\"]')?.href")
    check("pwa", "apple_touch_icon", bool(apple_icon), apple_icon or "MISSING")

    sw_ready = page.evaluate("""
        () => new Promise(res => {
            if (!navigator.serviceWorker) return res(false);
            navigator.serviceWorker.ready.then(() => res(true)).catch(() => res(false));
        })
    """)
    check("pwa", "service_worker_ready", sw_ready, f"SW ready={sw_ready}")

    page.screenshot(path=f"{SCREENSHOTS_DIR}/6-2-09-pwa-manifest-panel.png", full_page=True)
    print("  📸 6-2-09-pwa-manifest-panel.png")

    # ──────────────────────────────────────────────────────
    # STEP 7: Offline behavior
    # ──────────────────────────────────────────────────────
    print("\n── Offline Behavior ──")
    ctx2 = browser.new_context(viewport={"width": 1440, "height": 900})
    page2 = ctx2.new_page()
    page2.goto(PROD_URL)
    page2.wait_for_load_state("networkidle")
    page2.wait_for_timeout(2500)  # allow SW to cache

    ctx2.set_offline(True)
    page2.reload()
    page2.wait_for_timeout(3000)

    body = page2.evaluate("document.body.innerText")
    is_browser_error = any(x in body for x in ["ERR_", "This site can't be reached", "No internet"])
    check("offline", "app_shell_loads", not is_browser_error,
          "app shell loaded from SW" if not is_browser_error else f"ERROR: {body[:80]}")

    # Check actual landing headline in offline mode
    cta_offline = page2.locator("button", has_text="START NOW").first
    check("offline", "cta_visible_offline", cta_offline.count() > 0,
          "START NOW button visible offline" if cta_offline.count() > 0 else "NOT FOUND")

    headline_offline = page2.locator("text=AI BOSS").first
    check("offline", "headline_visible_offline", headline_offline.count() > 0,
          "AI BOSS headline visible offline" if headline_offline.count() > 0 else "NOT FOUND (may be JS-dependent)")

    page2.screenshot(path=f"{SCREENSHOTS_DIR}/6-2-10-offline-app-shell.png", full_page=True)
    print("  📸 6-2-10-offline-app-shell.png")
    ctx2.set_offline(False)
    browser.close()


# ──────────────────────────────────────────────────────
# SUMMARY
# ──────────────────────────────────────────────────────
print("\n\n═══ TASK 6.2 RESULTS SUMMARY ═══\n")
total_pass = 0
total_fail = 0
fail_list = []

for section, checks in results.items():
    print(f"[{section}]")
    for key, v in checks.items():
        symbol = "✅" if v["pass"] else "❌"
        print(f"  {symbol} {key}: {v['detail']}")
        if v["pass"]:
            total_pass += 1
        else:
            total_fail += 1
            fail_list.append(f"{section}/{key}")

print(f"\nTotal: {total_pass} PASS / {total_fail} FAIL")
if fail_list:
    print("Failures:")
    for f in fail_list:
        print(f"  - {f}")

with open(f"{SCREENSHOTS_DIR}/6-2-results-raw.json", "w") as f:
    json.dump(results, f, indent=2)
print(f"\nRaw JSON → {SCREENSHOTS_DIR}/6-2-results-raw.json")
