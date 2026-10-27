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
  await expect(page.getByRole('heading', {name: '이번 구간'})).toBeVisible();
  await expect(page.getByRole('region', {name: '시계'})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Start'})).toBeVisible();
  await expect(page.getByRole('region', {name: '날씨'})).toContainText('서울');
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

test('pins a card and shows quote and word cards', async ({page}) => {
  await page.goto('/');
  const pin = page.getByRole('button', {name: '날씨 고정'});
  await pin.click();
  await expect(pin).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('region', {name: '날씨'})).toHaveAttribute(
    'data-pinned',
    'true'
  );
  await expect(page.getByRole('region', {name: '명언'})).toContainText('남은 시간');
  await expect(page.getByRole('region', {name: '단어'})).toContainText(
    'steady attention'
  );
});

test('summarizes today and restores a closed card', async ({page}) => {
  await page.addInitScript(() => {
    const now = new Date();
    const dateId = [now.getFullYear(), now.getMonth() + 1, now.getDate()].join('-');
    localStorage.setItem(
      'PomodoroFocusData',
      JSON.stringify({
        dateId,
        focusCount: 1,
        focusPeriod: [
          'Focus,09:00:00,09:25:00',
          'Break,09:25:00,09:30:00',
          'Lost,09:30:00,09:32:00'
        ]
      })
    );
  });
  await page.goto('/');
  await expect(page.getByText('Focus 25분')).toBeVisible();
  await expect(page.getByText('Break 5분')).toBeVisible();
  await expect(page.getByText('Lost 2분')).toBeVisible();
  await page.getByRole('button', {name: '날씨 닫기'}).click();
  await expect(page.getByRole('region', {name: '날씨'})).toHaveCount(0);
  await page.getByRole('button', {name: '카드 추가'}).click();
  await page.getByRole('menuitem', {name: '날씨'}).click();
  await expect(page.getByRole('region', {name: '날씨'})).toBeVisible();
});

test('keeps action buttons and timer settings above the cards', async ({page}) => {
  await page.goto('/');
  const quoteRefresh = page.getByRole('button', {name: '명언 새로고침'});
  const quoteBorder = await quoteRefresh.evaluate(
    element => getComputedStyle(element).borderTopWidth
  );
  const quotePadding = await quoteRefresh.evaluate(
    element => getComputedStyle(element).paddingTop
  );
  expect(quoteBorder).not.toBe('0px');
  expect(quotePadding).not.toBe('0px');

  const startRadius = await page
    .getByRole('button', {name: 'Start', exact: true})
    .evaluate(element => getComputedStyle(element).borderRadius);
  expect(startRadius).toBe('999px');

  await page.getByRole('button', {name: '타이머 설정'}).click();
  const dialog = page.getByRole('dialog', {name: '구간 길이'});
  await expect(dialog).toBeVisible();
  const overlayZ = await dialog.evaluate(
    element => getComputedStyle(element.parentElement!).zIndex
  );
  expect(Number(overlayZ)).toBeGreaterThan(100);
  await page.getByRole('button', {name: 'Save'}).click();
  await expect(dialog).toHaveCount(0);
});
