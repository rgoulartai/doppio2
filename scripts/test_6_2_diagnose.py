"""Diagnose selector mismatches for Task 6.2"""
from playwright.sync_api import sync_playwright

PROD_URL = "https://doppio.kookyos.com"
IPHONE_UA = (
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) "
    "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # ── Landing page: find actual headline + iOS banner structure ──
    ctx = browser.new_context(
        viewport={"width": 390, "height": 844},
        user_agent=IPHONE_UA,
        is_mobile=True, has_touch=True,
    )
    page = ctx.new_page()
    page.goto(PROD_URL)
    page.wait_for_load_state("networkidle")
    page.wait_for_timeout(1000)

    print("── H1/H2/H3 tags ──")
    headings = page.evaluate("""
        () => Array.from(document.querySelectorAll('h1,h2,h3')).map(h => h.tagName + ': ' + h.innerText.trim().slice(0, 80))
    """)
    for h in headings:
        print(f"  {h}")

    print("\n── iOS install banner HTML ──")
    banner_html = page.evaluate("""
        () => {
            const el = document.querySelector('[data-testid="ios-install-banner"]');
            if (el) return el.outerHTML.slice(0, 500);
            // Try to find by text
            const texts = Array.from(document.querySelectorAll('*')).filter(e => e.innerText && e.innerText.includes('Add to Home Screen'));
            return texts.length ? texts[0].outerHTML.slice(0, 500) : 'NOT FOUND';
        }
    """)
    print(f"  {banner_html}")

    print("\n── Buttons on landing ──")
    buttons = page.evaluate("""
        () => Array.from(document.querySelectorAll('button')).map(b => b.getAttribute('data-testid') + ' | ' + b.innerText.trim().slice(0,40))
    """)
    for b in buttons:
        print(f"  {b}")

    # ── Navigate through trial to learn ──
    print("\n── Navigating: Landing → Trial → Learn ──")
    page.get_by_role("button", name="START NOW").first.click()
    page.wait_for_load_state("networkidle")
    print(f"  URL after CTA: {page.url}")

    if "/trial" in page.url:
        print("  On /trial — inspecting form fields:")
        inputs = page.evaluate("""
            () => Array.from(document.querySelectorAll('input')).map(i => i.type + ' | name=' + i.name + ' | placeholder=' + i.placeholder)
        """)
        for inp in inputs:
            print(f"    {inp}")
        btns = page.evaluate("() => Array.from(document.querySelectorAll('button')).map(b => b.type + ' | ' + b.innerText.trim().slice(0,40))")
        for b in btns:
            print(f"    btn: {b}")

        # Fill the form
        name_inp = page.locator("input").first
        name_inp.fill("TestUser")
        email_inp = page.locator("input[type='email']").first
        email_inp.fill("test@example.com")
        submit = page.locator("button[type='submit']").first
        if submit.count() == 0:
            submit = page.locator("button").last
        submit.click()
        page.wait_for_load_state("networkidle")
        print(f"  URL after trial submit: {page.url}")

    print(f"\n── Learn page selectors ──")
    print(f"  URL: {page.url}")

    cards = page.evaluate("""
        () => {
            const cards = document.querySelectorAll('[data-testid="video-card"]');
            const fallback = document.querySelectorAll('[class*="card"]');
            return { by_testid: cards.length, by_class: fallback.length }
        }
    """)
    print(f"  Cards: {cards}")

    prog = page.evaluate("""
        () => {
            const pb = document.querySelector('[data-testid="progress-bar"]');
            const role = document.querySelector('[role="progressbar"]');
            const cls = document.querySelector('[class*="progress"]');
            return { by_testid: !!pb, by_role: !!role, by_class: cls?.className }
        }
    """)
    print(f"  Progress: {prog}")

    done_btns = page.evaluate("""
        () => Array.from(document.querySelectorAll('button')).map(b => b.getAttribute('data-testid') + ' | ' + b.innerText.trim().slice(0,50))
    """)
    print(f"  Buttons on learn:")
    for b in done_btns:
        print(f"    {b}")

    # ── Offline: check what renders ──
    print("\n── Offline page text ──")
    ctx2 = browser.new_context(viewport={"width": 1440, "height": 900})
    page2 = ctx2.new_page()
    page2.goto(PROD_URL)
    page2.wait_for_load_state("networkidle")
    page2.wait_for_timeout(2500)
    ctx2.set_offline(True)
    page2.reload()
    page2.wait_for_timeout(3000)
    offline_text = page2.evaluate("document.body.innerText.slice(0,300)")
    print(f"  {offline_text}")
    headings_offline = page2.evaluate("""
        () => Array.from(document.querySelectorAll('h1,h2,h3,h4')).map(h => h.tagName + ': ' + h.innerText.trim().slice(0,60))
    """)
    for h in headings_offline:
        print(f"  heading: {h}")
    ctx2.set_offline(False)

    browser.close()
