export function formatElapsed(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return `+${String(minutes).padStart(2, '0')}:${String(remain).padStart(2, '0')}`;
}
