import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByRole('button', { name: 'Add Task' }).click();
  await page.getByRole('textbox', { name: 'Title' }).click();
  await page.getByRole('textbox', { name: 'Title' }).fill('Finished UI');
  await page.getByRole('textbox', { name: 'Description' }).click();
  await page.getByRole('textbox', { name: 'Description' }).fill('UI need to be finished');
  await page.getByRole('textbox', { name: 'Deadline' }).fill('2025-10-10');
  await page.getByRole('button', { name: 'Add Task' }).nth(1).click();
  await page.locator('div:nth-child(5) > .text-card-foreground > .px-6.flex > div:nth-child(2) > .inline-flex.items-center.justify-center.gap-2.whitespace-nowrap.text-sm.font-medium.transition-all.disabled\\:pointer-events-none.disabled\\:opacity-50.\\[\\&_svg\\]\\:pointer-events-none.\\[\\&_svg\\:not\\(\\[class\\*\\=\\\'size-\\\'\\]\\)\\]\\:size-4.shrink-0.\\[\\&_svg\\]\\:shrink-0.outline-none.focus-visible\\:border-ring.focus-visible\\:ring-ring\\/50.focus-visible\\:ring-\\[3px\\].aria-invalid\\:ring-destructive\\/20.dark\\:aria-invalid\\:ring-destructive\\/40.aria-invalid\\:border-destructive.size-9.rounded-xl.bg-green-500\\/20').click();
  await page.getByRole('button', { name: 'Finished Tasks' }).click();
  await page.getByRole('button', { name: '✕' }).click();
});