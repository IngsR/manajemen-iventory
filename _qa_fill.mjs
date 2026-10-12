export default async function run(page, ui) {
  const out = {};

  const read = () =>
    page.evaluate(() => ({
      email: document.querySelector("#email")?.value ?? null,
      password: document.querySelector("#password")?.value ?? null,
    }));

  const snap = await ui.snapshot();
  out.buttons = [...snap.matchAll(/@(e\d+) button "([^"]*)"/g)].map(
    (m) => m[2],
  );
  out.before = await read();

  // Click Supervisor only — do NOT submit anything else. Then look at the form.
  const ref = [...snap.matchAll(/@(e\d+) button "Supervisor/g)][0]?.[1];
  await ui.click(ref);
  await page.waitForTimeout(400);

  out.afterSupervisorClick = await read();
  out.urlRightAfterClick = page.url();

  return out;
}
