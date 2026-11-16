// public/favicon.svg 한 파일에서 웹 아이콘(PNG, ICO)과 데스크톱 앱 아이콘을 만든다.
// 실행: npm run icons
import {execFileSync} from 'node:child_process';
import {mkdirSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const svg = readFileSync(join(publicDir, 'favicon.svg'), 'utf8');

const page = await (await chromium.launch()).newPage();

async function render(size) {
  await page.setViewportSize({width: size, height: size});
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`
  );
  return page.screenshot({omitBackground: true});
}

// PNG를 그대로 담는 ICO다.
function ico(images) {
  const head = Buffer.alloc(6);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({size, data}) => {
    const entry = Buffer.alloc(16);
    entry[0] = size >= 256 ? 0 : size;
    entry[1] = size >= 256 ? 0 : size;
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });
  return Buffer.concat([head, ...entries, ...images.map(image => image.data)]);
}

writeFileSync(join(publicDir, 'logo192.png'), await render(192));
writeFileSync(join(publicDir, 'logo512.png'), await render(512));
const faviconSizes = [16, 32, 48];
const faviconImages = [];
for (const size of faviconSizes) {
  faviconImages.push({size, data: await render(size)});
}
writeFileSync(join(publicDir, 'favicon.ico'), ico(faviconImages));

const masterDir = join(tmpdir(), 'momentum-icon');
mkdirSync(masterDir, {recursive: true});
const master = join(masterDir, 'app-icon.png');
writeFileSync(master, await render(1024));
await page.context().browser().close();

const cli = join(root, 'node_modules', '@tauri-apps', 'cli', 'tauri.js');
execFileSync(process.execPath, [cli, 'icon', master], {cwd: root, stdio: 'inherit'});

// 윈도우 앱만 만들기 때문에 모바일 아이콘은 지운다.
for (const mobile of ['android', 'ios']) {
  rmSync(join(root, 'src-tauri', 'icons', mobile), {recursive: true, force: true});
}
