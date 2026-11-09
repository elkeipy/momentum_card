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
  await page.route('https://ntfy.sh/**', route =>
    route.fulfill({status: 200, body: 'ok'})
  );
});

test('shows the clock, weather, and pomodoro controls', async ({page}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', {name: 'This session'})).toBeVisible();
  await expect(page.getByRole('region', {name: '시계'})).toBeVisible();
  await expect(page.getByRole('button', {name: 'Start'})).toBeVisible();
  await expect(page.getByRole('progressbar', {name: '구간 진행'})).toHaveAttribute(
    'aria-valuenow',
    '0'
  );
  await expect(page.getByRole('region', {name: '날씨'})).toContainText('서울');
  await expect(page.getByText('체감온도: 20.1°C')).toBeVisible();
});

test('starts and pauses the pomodoro timer', async ({page}) => {
  await page.goto('/');
  const bar = page.getByRole('progressbar', {name: '구간 진행'});
  await expect(bar).toHaveAttribute('aria-valuenow', '0');
  await page.getByRole('button', {name: 'Start', exact: true}).click();
  const pauseButton = page.getByRole('button', {name: 'Pause', exact: true});
  await expect(pauseButton).toBeVisible();
  await expect(page.getByRole('region', {name: '뽀모도로'})).toHaveAttribute(
    'data-tone',
    'focus'
  );
  await expect
    .poll(async () => bar.getAttribute('aria-valuenow'), {timeout: 20000})
    .not.toBe('0');
  const filled = await bar.getAttribute('aria-valuenow');
  await pauseButton.click();
  await expect(page.getByRole('button', {name: 'Start', exact: true})).toBeVisible();
  await page.waitForTimeout(1200);
  await expect(bar).toHaveAttribute('aria-valuenow', filled ?? '0');
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
  await expect(dialog.getByRole('button', {name: 'Timer Text 늘리기'})).toBeVisible();
  const overlayZ = await dialog.evaluate(
    element => getComputedStyle(element.parentElement!).zIndex
  );
  expect(Number(overlayZ)).toBeGreaterThan(100);
  await dialog.getByRole('spinbutton', {name: 'Timer Text'}).fill('64');
  await dialog.locator('#focusColor').fill('#ff00aa');
  await page.getByRole('button', {name: 'Save'}).click();
  await expect(dialog).toHaveCount(0);
  const timer = page.getByText('25:00');
  const timerSize = await timer.evaluate(element => getComputedStyle(element).fontSize);
  const timerColor = await timer.evaluate(element => getComputedStyle(element).color);
  expect(timerSize).toBe('64px');
  expect(timerColor).toBe('rgb(255, 0, 170)');
});

test('changes only the pomodoro history height with the card', async ({page}) => {
  await page.setViewportSize({width: 1280, height: 900});
  await page.goto('/');
  const card = page.getByRole('region', {name: '뽀모도로'});
  const timer = card.getByText('25:00');
  const history = card.locator('[class*="empty"], [class*="tableWrap"]');
  const beforeTimer = await timer.boundingBox();
  const beforeHistory = await history.boundingBox();
  const handle = card.locator('[class*="resize"]');
  const handleBox = await handle.boundingBox();
  if (!beforeTimer || !beforeHistory || !handleBox) {
    throw new Error('pomodoro geometry missing');
  }
  const gripX = handleBox.x + handleBox.width / 2;
  const gripY = handleBox.y + handleBox.height / 2;
  await page.mouse.move(gripX, gripY);
  await page.mouse.down();
  await page.mouse.move(gripX, gripY - 160);
  await page.mouse.up();
  const shrunkTimer = await timer.boundingBox();
  const shrunkHistory = await history.boundingBox();
  if (!shrunkTimer || !shrunkHistory) {
    throw new Error('pomodoro geometry missing after shrink');
  }
  expect(Math.abs(shrunkTimer.height - beforeTimer.height)).toBeLessThan(2);
  expect(shrunkHistory.height).toBeLessThan(beforeHistory.height - 80);
  const shrunkHandle = await handle.boundingBox();
  if (!shrunkHandle) {
    throw new Error('resize handle missing');
  }
  const growX = shrunkHandle.x + shrunkHandle.width / 2;
  const growY = shrunkHandle.y + shrunkHandle.height / 2;
  await page.mouse.move(growX, growY);
  await page.mouse.down();
  await page.mouse.move(growX, growY + 160);
  await page.mouse.up();
  const grownTimer = await timer.boundingBox();
  const grownHistory = await history.boundingBox();
  if (!grownTimer || !grownHistory) {
    throw new Error('pomodoro geometry missing after grow');
  }
  expect(Math.abs(grownTimer.height - beforeTimer.height)).toBeLessThan(2);
  expect(grownHistory.height).toBeGreaterThan(shrunkHistory.height + 80);
});

test('switches the board theme and restores the default', async ({page}) => {
  await page.goto('/');
  const theme = page.getByLabel('테마');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
  await theme.selectOption('flat');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'flat');
  const radius = await page
    .getByRole('button', {name: 'Start', exact: true})
    .evaluate(element => getComputedStyle(element).borderRadius);
  expect(radius).toBe('0px');
  await theme.selectOption('icons3d');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'icons3d');
  await theme.selectOption('default');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
  const stored = await page.evaluate(() => localStorage.getItem('momentum-theme'));
  expect(stored).toBe('default');
});

test('focuses the todo field with alt+t', async ({page}) => {
  await page.goto('/');
  await page.locator('body').click();
  await page.keyboard.press('Alt+t');
  await expect(page.getByLabel('할 일 추가')).toBeFocused();
});

test('renames a todo by double clicking its text', async ({page}) => {
  await page.goto('/');
  const card = page.getByRole('region', {name: '할 일'});
  await card.getByLabel('할 일 추가').fill('write tests');
  await card.getByRole('button', {name: '추가'}).click();
  await expect(card.getByText('write tests')).toHaveAttribute('title', 'write tests');
  await card.getByText('write tests').dblclick();
  const field = card.getByRole('textbox', {name: 'write tests 수정'});
  const fieldBox = await field.boundingBox();
  const rowBox = await field.locator('xpath=ancestor::li').boundingBox();
  if (!fieldBox || !rowBox) {
    throw new Error('todo editor geometry missing');
  }
  expect(fieldBox.width).toBeGreaterThan(rowBox.width * 0.6);
  await field.fill('rewrite tests');
  await field.press('Enter');
  await expect(card.getByText('rewrite tests')).toBeVisible();
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

test('saves an ntfy topic from the header', async ({page}) => {
  await page.goto('/');
  await page.getByRole('button', {name: '푸시 알림'}).click();
  const dialog = page.getByRole('dialog', {name: '푸시 알림'});
  await dialog.getByLabel('ntfy 토픽').fill('desk-42');
  await dialog.getByRole('button', {name: 'Save'}).click();
  await expect(dialog).toHaveCount(0);
  const stored = await page.evaluate(() => localStorage.getItem('ntfy-topic'));
  expect(stored).toBe('desk-42');
});
