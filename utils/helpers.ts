import { Page, ConsoleMessage } from '@playwright/test';

/**
 * Asserts the page has no horizontal scroll/overflow at its current viewport size.
 * Throws with the offending widths so a failure is immediately actionable.
 */
export async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  if (scrollWidth > clientWidth) {
    throw new Error(
      `Horizontal overflow detected: document.scrollWidth (${scrollWidth}px) exceeds clientWidth (${clientWidth}px)`
    );
  }
}

export interface ConsoleErrorEntry {
  text: string;
  location: string;
}

/**
 * Starts collecting browser console "error" messages for this page.
 * Call the returned function at any point to read everything collected so far.
 * Does not assert or fail anything — callers decide what to do with the list.
 */
export function collectConsoleErrors(page: Page): () => ConsoleErrorEntry[] {
  const errors: ConsoleErrorEntry[] = [];

  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      const loc = msg.location();
      errors.push({
        text: msg.text(),
        location: `${loc.url}:${loc.lineNumber}:${loc.columnNumber}`,
      });
    }
  });

  return () => errors;
}
