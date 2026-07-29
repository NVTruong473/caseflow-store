import { expect, test } from "@playwright/test";

const ARTIFACT_DIR = ".agent/artifacts/video-audio-t01/browser";

test("homepage introduction opens an accessible local video dialog", async ({
  page,
  request,
}) => {
  const runtimeErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") runtimeErrors.push(message.text());
  });
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  const mediaResponse = await request.get(
    "/media/caseflow-books-introduction-vi.mp4",
    {
      headers: { Range: "bytes=0-1023" },
    },
  );
  expect([200, 206]).toContain(mediaResponse.status());
  expect(mediaResponse.headers()["content-type"]).toContain("video/mp4");

  await page.setViewportSize({ height: 1000, width: 1440 });
  await page.goto("/", { waitUntil: "domcontentloaded" });

  const openButton = page.locator("[data-home-introduction-open]");
  await expect(openButton).toBeVisible();
  await openButton.click();

  const dialog = page.locator("[data-home-introduction-dialog]");
  const closeButton = page.locator("[data-home-introduction-close]");
  const video = page.locator("[data-home-introduction-video]");
  await expect(dialog).toBeVisible();
  await expect(closeButton).toBeFocused();
  await expect(video).toHaveAttribute("preload", "metadata");
  await expect(video).toHaveAttribute(
    "poster",
    "/media/caseflow-books-introduction-poster.png",
  );
  await expect(video.locator("track[kind='captions']")).toHaveAttribute(
    "src",
    "/media/caseflow-books-introduction-vi.vtt",
  );
  await expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) => element.duration),
    )
    .toBeGreaterThan(213);
  await expect
    .poll(() =>
      video.evaluate((element: HTMLVideoElement) => element.duration),
    )
    .toBeLessThan(215);
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  expect(await getHorizontalOverflow(page)).toBeLessThanOrEqual(1);

  await page.screenshot({
    fullPage: false,
    path: `${ARTIFACT_DIR}/homepage-introduction-desktop.png`,
  });

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(openButton).toBeFocused();
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
  expect(runtimeErrors).toEqual([]);
});

test("homepage introduction remains contained on mobile", async ({ page }) => {
  await page.setViewportSize({ height: 812, width: 375 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.locator("[data-home-introduction-open]").click();

  const dialog = page.locator("[data-home-introduction-dialog]");
  const video = page.locator("[data-home-introduction-video]");
  await expect(dialog).toBeVisible();
  await expect(video).toBeVisible();
  expect(await getHorizontalOverflow(page)).toBeLessThanOrEqual(1);

  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.width).toBeLessThanOrEqual(375);

  await page.screenshot({
    fullPage: false,
    path: `${ARTIFACT_DIR}/homepage-introduction-mobile.png`,
  });

  await page.locator("[data-home-introduction-close]").click();
  await expect(dialog).toBeHidden();
});

async function getHorizontalOverflow(page: import("@playwright/test").Page) {
  return page.evaluate(
    () =>
      Math.max(
        document.documentElement.scrollWidth,
        document.body.scrollWidth,
      ) - window.innerWidth,
  );
}
