import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch();pg=await b.new_page(viewport={'width':1920,'height':1080})
        for s in 'ABC':
            await pg.goto(f'file:///home/claude/kobo/demo/styles/stall.html?s={s}');await pg.wait_for_timeout(400)
            await pg.screenshot(path=f'/home/claude/kobo/demo/styles/still_{s}.png')
        await b.close()
asyncio.run(main())
