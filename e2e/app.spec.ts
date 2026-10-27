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
