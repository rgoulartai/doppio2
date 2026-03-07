"""Diagnose Supabase auth from console + wait for auth init"""
from playwright.sync_api import sync_playwright
import json

PROD_URL = "https://doppio.kookyos.com"
AUTH_KEY = "sb-tqknjbjvdkipszyghfgj-auth-token"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={"width": 1440, "height": 900})
    page = ctx.new_page()

    console_msgs = []
    page.on("console", lambda msg: console_msgs.append(f"[{msg.type}] {msg.text[:120]}"))

    page.goto(PROD_URL)
    page.wait_for_load_state("networkidle")

    # Check at 1s, 2s, 3s, 5s intervals
    for wait_ms in [1000, 1000, 1000, 2000]:
        page.wait_for_timeout(wait_ms)
        keys = page.evaluate("Object.keys(localStorage)")
        token = page.evaluate(f"localStorage.getItem('{AUTH_KEY}')")
        elapsed = sum([1000, 1000, 1000, 2000][:([1000,1000,1000,2000].index(wait_ms)+1)])
        print(f"  @{elapsed}ms: localStorage keys={keys}, auth_token={'FOUND' if token else 'NOT FOUND'}")
        if token:
            data = json.loads(token)
            print(f"    token keys: {list(data.keys())}")
            print(f"    user.id: {data.get('user', {}).get('id')}")
            break

    print("\n=== Relevant console messages ===")
    for m in console_msgs:
        if any(x in m.lower() for x in ["supabase", "auth", "doppio", "error", "warn", "anon"]):
            print(f"  {m}")

    browser.close()
