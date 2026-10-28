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
  await expect(page.getByRole('heading', {name: 'This session'})).toBeVisible();
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
  await expect(
    page.getByRole('progressbar', {name: '명언 남은 시간'})
  ).toBeVisible();
  await expect(page.getByRole('button', {name: '명언 새로고침'})).toBeVisible();
  await expect(page.getByRole('progressbar', {name: '단어 남은 시간'})).toBeVisible();
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
  await page.getByRole('button', {name: '카드 목록'}).click();
  const weatherToggle = page.getByRole('menuitemcheckbox', {name: '날씨'});
  await expect(weatherToggle).toHaveAttribute('aria-checked', 'false');
  await weatherToggle.click();
  const weather = page.getByRole('region', {name: '날씨'});
  await expect(weather).toBeVisible();
  const weatherZ = await weather.evaluate(element => Number(getComputedStyle(element).zIndex) || 0);
  const pomodoroZ = await page
    .getByRole('region', {name: '뽀모도로'})
    .evaluate(element => Number(getComputedStyle(element).zIndex) || 0);
  expect(weatherZ).toBeGreaterThan(pomodoroZ);
});

test('keeps cards below the top bar so their headers stay draggable', async ({
  page
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'feature-card:weather',
      JSON.stringify({
        x: 24,
        y: 0,
        width: 420,
        height: 168,
        pinned: false,
        placed: true
      })
    );
  });
  await page.goto('/');
  const weather = page.getByRole('region', {name: '날씨'});
  const mast = page.locator('header.mast');
  const mastBottom = () => mast.evaluate(element => element.getBoundingClientRect().bottom);
  const weatherTop = () => weather.evaluate(element => element.getBoundingClientRect().top);
  await expect(weather).toBeVisible();
  expect(await weatherTop()).toBeGreaterThanOrEqual(await mastBottom());

  const header = weather.locator('header');
  const headerBox = await header.boundingBox();
  expect(headerBox).not.toBeNull();
  const hit = await header.evaluate(element => {
    const rect = element.getBoundingClientRect();
    const topElement = document.elementFromPoint(rect.left + 24, rect.top + 8);
    return element.contains(topElement);
  });
  expect(hit).toBe(true);

  await header.hover();
  await page.mouse.down();
  await page.mouse.move(headerBox!.x + headerBox!.width / 2, 0);
  await page.mouse.up();
  expect(await weatherTop()).toBeGreaterThanOrEqual(await mastBottom());
});

test('keeps action buttons and timer settings above the cards', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('button', {name: '명언 새로고침'})).toBeVisible();

  const startRadius = await page
    .getByRole('button', {name: 'Start', exact: true})
    .evaluate(element => getComputedStyle(element).borderRadius);
  expect(startRadius).toBe('999px');

  await page.getByRole('button', {name: '뽀모도로 설정'}).click();
  const dialog = page.getByRole('dialog', {name: '구간 길이'});
  await expect(dialog).toBeVisible();
  const overlayZ = await dialog.evaluate(
    element => getComputedStyle(element.parentElement!).zIndex
  );
  expect(Number(overlayZ)).toBeGreaterThan(100);
  await dialog.getByLabel('Timer Text').fill('64');
  await page.getByRole('button', {name: 'Save'}).click();
  await expect(dialog).toHaveCount(0);
  const timerSize = await page.getByText('25:00').evaluate(
    element => getComputedStyle(element).fontSize
  );
  expect(timerSize).toBe('64px');
});

test('adds and completes a todo on the board', async ({page}) => {
  await page.goto('/');
  const card = page.getByRole('region', {name: '할 일'});
  await expect(card).toBeVisible();
  await card.getByLabel('할 일 추가').fill('write tests');
  await card.getByRole('button', {name: '추가'}).click();
  await expect(card.getByText('write tests')).toBeVisible();
  await card.getByRole('checkbox', {name: 'write tests'}).check();
  await expect(card.getByRole('checkbox', {name: 'write tests'})).toBeChecked();
  await card.getByRole('button', {name: 'write tests 삭제'}).click();
  await expect(card.getByText('할 일을 추가하면 여기에 쌓인다.')).toBeVisible();
  await card.getByLabel('할 일 추가').fill('call @');
  await expect(card.getByLabel('마감 시')).toBeVisible();
  await expect(card.getByLabel('마감 분')).toBeVisible();
});
