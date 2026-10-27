import {expect, test} from '@playwright/test';

const weatherBody = JSON.stringify({
  current: {
    temperature_2m: 21.5,
    apparent_temperature: 20.1
  }
});

const locationBody = JSON.stringify({
  city: '서울'
});

const definitionBody = JSON.stringify([
  {meanings: [{definitions: [{definition: 'steady attention'}]}]}
]);

test.beforeEach(async ({page}) => {
  await page.route('**/api.open-meteo.com/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: weatherBody
    })
  );
  await page.route('**/api.bigdatacloud.net/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: locationBody
    })
  );
  await page.route('**/api.dictionaryapi.dev/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: definitionBody
    })
  );
});

test('shows the clock, weather, and pomodoro controls', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', {level: 2})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Start'})).toBeVisible();
  await expect(page.getByRole('heading', {level: 3}).filter({hasText: '서울'})).toBeVisible();
  await expect(page.getByText('체감온도: 20.1°C')).toBeVisible();
});

test('starts and stops the pomodoro timer', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button', {name: 'Start', exact: true}).click();
  const stopButton = page.getByRole('button', {name: 'Stop', exact: true});
  await expect(stopButton).toBeVisible();
  await stopButton.click();
  await expect(page.getByRole('button', {name: 'Start', exact: true})).toBeVisible();
});

test('pins a card, switches theme, and shows quote and word cards', async ({page}) => {
  await page.goto('/');
  const pin = page.getByRole('button', {name: '날씨 고정'});
  await pin.click();
  await expect(pin).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('region', {name: '날씨'})).toHaveAttribute('data-pinned', 'true');
  await page.getByLabel('테마').selectOption('flat');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'flat');
  await expect(page.getByRole('region', {name: '명언'})).toContainText('남은 시간');
  await expect(page.getByRole('region', {name: '단어'})).toContainText('steady attention');
});
