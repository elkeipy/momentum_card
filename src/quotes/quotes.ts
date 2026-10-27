export const QUOTE_REFRESH_MS = 60 * 1000;

export type Quote = {
  text: string;
  from: string;
};

export const QUOTES: Quote[] = [
  {text: '한 구간만 끝내면 다음이 가벼워진다.', from: 'momentum'},
  {text: '시작은 작게, 끝은 오늘 안으로.', from: 'momentum'},
  {text: '흐트러지면 다시 25분이다.', from: 'momentum'},
  {text: '자리로 돌아오는 것도 일이다.', from: 'momentum'},
  {text: '끝난 시간을 세지 말고 다음 시작을 눌러라.', from: 'momentum'}
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
