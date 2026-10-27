import {defineConfig, devices} from '@playwright/test';

const devServerPort = 3000;
const devServerUrl = `http://127.0.0.1:${devServerPort}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', {open: 'never'}]],
  use: {
    baseURL: devServerUrl,
    trace: 'on-first-retry',
    geolocation: {latitude: 37.5665, longitude: 126.978},
    permissions: ['geolocation']
  },
  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']}
    }
  ],
  webServer: {
    command: 'npm start',
    url: devServerUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      BROWSER: 'none',
      PORT: String(devServerPort)
    }
  }
});
