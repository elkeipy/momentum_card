import type {Lang} from '../i18n/i18n';

export const QUOTE_REFRESH_MS = 60 * 1000;

export type Quote = {
  text: Record<Lang, string>;
  from: string;
};

export const QUOTES: Quote[] = [
  {
    text: {ko: '한 구간만 끝내면 다음이 가벼워진다.', en: 'Finish one interval and the next one feels lighter.'},
    from: 'momentum'
  },
  {
    text: {ko: '시작은 작게, 끝은 오늘 안으로.', en: 'Start small. Finish today.'},
    from: 'momentum'
  },
  {
    text: {ko: '흐트러지면 다시 25분이다.', en: 'Lose focus, and it is another 25 minutes.'},
    from: 'momentum'
  },
  {
    text: {ko: '자리로 돌아오는 것도 일이다.', en: 'Coming back to your desk is work too.'},
    from: 'momentum'
  },
  {
    text: {
      ko: '끝난 시간을 세지 말고 다음 시작을 눌러라.',
      en: 'Do not count the time that is over. Press start on the next one.'
    },
    from: 'momentum'
  }
];

export function remainingQuoteSeconds(elapsedMs: number): number {
  const remain = QUOTE_REFRESH_MS - elapsedMs;
  return Math.max(0, Math.ceil(remain / 1000));
}

export function nextQuoteIndex(current: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  return (current + 1) % length;
}
