import {publishNtfy} from './notify/ntfy';
import {formatElapsed} from './pomodoro/formatElapsed';
import {
  DEFAULT_PERIOD_COLORS,
  periodColorsFrom,
  publishPeriodColors,
  type PeriodColors
} from './pomodoro/periodColors';

export type CardTone = 'focus' | 'break' | 'lost';

interface PomodoroTimerProps {
  setTimerText: (timer: string) => void;
  setCurrentStateText: (index: string) => void;
  setStartStopButtonText: (text: string) => void;
  setTimerTextColor: (color: string) => void;
  setCardTone?: (tone: CardTone) => void;
  setTimerProgress?: (ratio: number) => void;
}

export type TimerSettings = PeriodColors & {
  focusTime: number;
  shortBreak: number;
  longBreak: number;
  longBreakInterval: number;
}

const PeriodType = {
  Focus: "Focus", // Focus Time
  Break: "Break", // Break Time
  Lost: "Lost",  // Lost Time
  Pause: "Pause", // Pause during Focus/Break
} as const;
type PeriodTypes = (typeof PeriodType)[keyof typeof PeriodType];
type ActivePeriodTypes = typeof PeriodType.Focus | typeof PeriodType.Break | typeof PeriodType.Lost;

type PeriodData = {
  periodType: PeriodTypes;
  startDate: Date;
  finishDate: Date;
}

type FocusStorageData = {
  dateId: string;
  focusCount: number;
  focusPeriod: Array<string>;
}

//const timeManager = new TimeManager();
//timeManager.addTimePair(new Date('2025-01-27T09:00:00'), new Date('2025-01-27T10:00:00'));
//timeManager.addTimePair(new Date('2025-01-27T11:00:00'), new Date('2025-01-27T12:00:00'));
//
//const timePairs = timeManager.getTimePairs();
//
//timePairs.forEach((pair, index) => {
//  const [startTime, endTime] = pair;
//  console.log(`Time Pair ${index + 1}:`);
//  console.log(`  Start Time: ${startTime}`);
//  console.log(`  End Time: ${endTime}`);
//});

class PomodoroTimer {
  private audio: HTMLAudioElement;

  private _timerID: NodeJS.Timeout | null = null;
  private _startDate: Date | null = null;
  private _awayFromDeskDate: Date | null = null;
  private _checkAwayFromDeskTimerId: NodeJS.Timeout | null = null;
  private _awayFromDeskTimerId: NodeJS.Timeout | null = null;
  private _currentTimerMinutes: number = 25;
  private _budgetSeconds: number = 25 * 60;
  private _spanSeconds: number = 25 * 60;
  private _paused: boolean = false;
  private _pauseStartedAt: Date | null = null;
  private _termChunks: string[] = [];
  private _focusCount: number = 1;
  private _periodType: ActivePeriodTypes = PeriodType.Break;
  private _shownPeriod: ActivePeriodTypes = PeriodType.Focus;
  private _timePeriod: Array<string> = [];
  
  private readonly FOCUS_MIN: number = 25;
  private readonly SHORT_BREAK_MIN: number = 5;
  private readonly LONG_BREAK_MIN: number = 15;
  private readonly LONG_BREAK_INTERVAL: number = 4;
  private readonly MAX_FOCUS_MIN: number = 60;
  private readonly MAX_SHORT_BREAK_MIN: number = 30;
  private readonly MAX_LONG_BREAK_MIN: number = 30;
  private readonly MAX_LONG_BREAK_INTERVAL: number = 10;
  private readonly MAX_FOCUS_COUNT: number = 999;
  private readonly MAX_STORED_PERIODS: number = 300;
  private readonly TIMER_TICK_MS: number = 300;
  private readonly AWAY_CHECK_MS: number = 60 * 1000;
  private readonly PERIOD_PATTERN: RegExp =
    /^(Focus|Break|Lost|Pause),\d{2}:\d{2}:\d{2},\d{2}:\d{2}:\d{2}$/;
  private readonly BTN_START_TEXT: string = 'Start';
  private readonly BTN_PAUSE_TEXT: string = 'Pause';
  private readonly COLOR_UNMANAGED: string = 'var(--warning)';
  private readonly PomodoroFocusLocalStorageKey: string = 'PomodoroFocusData';
  private readonly PomodoroSettingsLocalStorageKey: string = 'PomodoroSettings';

  private _settingsData!: TimerSettings;

  private setTimerText: (timer: string) => void;
  private setCurrentStateText: (index: string) => void;
  private setStartStopButtonText: (text: string) => void;
  private setTimerTextColor: (color: string) => void;
  private setCardTone?: (tone: CardTone) => void;
  private setTimerProgress?: (ratio: number) => void;

  constructor({setTimerText, setCurrentStateText, setStartStopButtonText, setTimerTextColor, setCardTone, setTimerProgress} : PomodoroTimerProps) {
    this.setTimerText = setTimerText;
    this.setCurrentStateText = setCurrentStateText;
    this.setStartStopButtonText = setStartStopButtonText;
    this.setTimerTextColor = setTimerTextColor;
    this.setCardTone = setCardTone;
    this.setTimerProgress = setTimerProgress;

    this.audio = new Audio(`${process.env.PUBLIC_URL}/alarmSound.mp3`);

    this.init();
  }

  public getSettings() {
    return this._settingsData;
  }

  private loadLatestPeriodType(): ActivePeriodTypes {
    for (let index = this._timePeriod.length - 1; index >= 0; index -= 1) {
      const periodData = this.parseStringToPeriodData(this._timePeriod[index]);
      if (periodData.periodType !== PeriodType.Pause) {
        return periodData.periodType as ActivePeriodTypes;
      }
    }
    return PeriodType.Break;
  }

  private existSavedPeriodData(): boolean {
    return this._timePeriod.length > 0;
  }

  private init() {
    this.loadLocalStorageFocusData();
    this.loadSettings();
    let nextPeriodType: ActivePeriodTypes = PeriodType.Focus;
    if (this.existSavedPeriodData()) {
      nextPeriodType = this.getNextPeriodType(this.loadLatestPeriodType());
    }
    this.changeTimerTextColorByFocused(nextPeriodType);
    this.setCurrentStateText(this.makeCurrentStateText(nextPeriodType));
    this._currentTimerMinutes = this.getNextTimerMinutes(nextPeriodType, this._focusCount);
    this.resetTimer();
  }

  private makeCurrentStateText(periodType: ActivePeriodTypes): string {
    return `[${periodType.toString()}] #${this._focusCount}`;
  }

  private formatDate(date: Date): string {
    let hours = String(date.getHours()).padStart(2, '0');
    let minutes = String(date.getMinutes()).padStart(2, '0');
    let seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  private parseStringToDate(timeStr: string): Date {
    let [hours, minutes, seconds] = timeStr.split(':').map(Number);
    let rtnDate = new Date();
    rtnDate.setHours(hours, minutes, seconds, 0);
    return rtnDate;
  }

  private makeDateTimePeriodString(periodType: PeriodTypes, startTime: Date, finishTime: Date): string {
    let periodStr = [periodType.toString(), this.formatDate(startTime), this.formatDate(finishTime)].join(',');
    return periodStr;
  }

  private parseStringToPeriodData(periodStr: string): PeriodData {
    let datas = periodStr.split(',');
    let rtnData: PeriodData = {
      periodType: datas[0] as PeriodTypes,
      startDate: this.parseStringToDate(datas[1]),
      finishDate: this.parseStringToDate(datas[2])
    }

    return rtnData;
  }

  private isValidFocusStorageData(data: unknown): data is FocusStorageData {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const focusData = data as FocusStorageData;
    return (
      /^\d{4}-\d{1,2}-\d{1,2}$/.test(focusData.dateId) &&
      Number.isInteger(focusData.focusCount) &&
      focusData.focusCount >= 1 &&
      focusData.focusCount <= this.MAX_FOCUS_COUNT &&
      Array.isArray(focusData.focusPeriod) &&
      focusData.focusPeriod.length <= this.MAX_STORED_PERIODS &&
      focusData.focusPeriod.every(
        (period) => typeof period === 'string' && this.PERIOD_PATTERN.test(period)
      )
    );
  }

  private isValidSettingsData(data: unknown): data is TimerSettings {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const settings = data as TimerSettings;
    return (
      this.isBoundedInteger(settings.focusTime, 1, this.MAX_FOCUS_MIN) &&
      this.isBoundedInteger(settings.shortBreak, 1, this.MAX_SHORT_BREAK_MIN) &&
      this.isBoundedInteger(settings.longBreak, 1, this.MAX_LONG_BREAK_MIN) &&
      this.isBoundedInteger(settings.longBreakInterval, 1, this.MAX_LONG_BREAK_INTERVAL)
    );
  }

  private withPeriodColors(settings: TimerSettings): TimerSettings {
    return {...settings, ...periodColorsFrom(settings)};
  }

  private defaultSettings(): TimerSettings {
    return {
      focusTime: this.FOCUS_MIN,
      shortBreak: this.SHORT_BREAK_MIN,
      longBreak: this.LONG_BREAK_MIN,
      longBreakInterval: this.LONG_BREAK_INTERVAL,
      ...DEFAULT_PERIOD_COLORS
    };
  }

  private isBoundedInteger(value: unknown, min: number, max: number): value is number {
    return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
  }

  private persistFocusPeriods(anchorDate: Date) {
    if (this._timePeriod.length > this.MAX_STORED_PERIODS) {
      this._timePeriod = this._timePeriod.slice(-this.MAX_STORED_PERIODS);
    }
    const saveData = {
      dateId: [
        anchorDate.getFullYear(),
        anchorDate.getMonth() + 1,
        anchorDate.getDate()
      ].join('-'),
      focusCount: this._focusCount,
      focusPeriod: this._timePeriod
    };
    localStorage.setItem(this.PomodoroFocusLocalStorageKey, JSON.stringify(saveData));
  }

  private queueTermChunk(
    periodType: PeriodTypes,
    startDate: Date,
    finishDate: Date
  ) {
    if (finishDate.getTime() <= startDate.getTime()) {
      return;
    }
    this._termChunks.push(
      this.makeDateTimePeriodString(periodType, startDate, finishDate)
    );
  }

  private flushTermChunks(anchorDate: Date) {
    if (this._termChunks.length === 0) {
      return;
    }
    this._timePeriod.push(...this._termChunks);
    this._termChunks = [];
    this.persistFocusPeriods(anchorDate);
  }

  private saveLocalStorageFocusData(
    periodType: PeriodTypes,
    startDate: Date,
    finishDate: Date
  ) {
    if (!startDate || !finishDate) {
      return;
    }
    if (finishDate.getTime() <= startDate.getTime()) {
      return;
    }
    this._timePeriod.push(
      this.makeDateTimePeriodString(periodType, startDate, finishDate)
    );
    this.persistFocusPeriods(startDate);
  }

  private loadLocalStorageFocusData() {
    this._focusCount = 1;
    const storedFocusData = localStorage.getItem(this.PomodoroFocusLocalStorageKey);
    if (storedFocusData) {
      let loadFocusData: FocusStorageData | null = null;
      try {
        const parsedData = JSON.parse(storedFocusData);
        loadFocusData = this.isValidFocusStorageData(parsedData) ? parsedData : null;
      } catch {
        loadFocusData = null;
      }

      if (!loadFocusData) {
        this._focusCount = 1;
        this._timePeriod = new Array<string>();
        return;
      }

      let now = new Date();
      let dateId = [now.getFullYear(), now.getMonth() + 1, now.getDate()].join('-');
      if (dateId === loadFocusData.dateId) {
        this._focusCount = loadFocusData.focusCount ? loadFocusData.focusCount : 1;
        this._timePeriod = loadFocusData.focusPeriod ? loadFocusData.focusPeriod : new Array<string>();
      } else {
        this._focusCount = 1;
        this._timePeriod = new Array<string>();
      }
    }
  }

  public saveLocalStorageSettings(settings: TimerSettings) {
    if (!this.isValidSettingsData(settings)) {
      return;
    }
    const next = this.withPeriodColors(settings);
    this._settingsData = next;
    this._currentTimerMinutes = next.focusTime;
    localStorage.setItem(this.PomodoroSettingsLocalStorageKey, JSON.stringify(next));
    if (!this._awayFromDeskDate) {
      this.changeTimerTextColorByFocused(this._shownPeriod);
    }
    publishPeriodColors();
  }

  private isTimerRunning() {
    return this._timerID !== null;
  }

  private clearCheckAwayFromDeskTimerInterval() {
    if (this._checkAwayFromDeskTimerId !== null) {
      clearInterval(this._checkAwayFromDeskTimerId);
    }
    this._checkAwayFromDeskTimerId = null;
  }

  private clearAwayFromDeskTimerInterval() {
    if (this._awayFromDeskTimerId !== null) {
      clearInterval(this._awayFromDeskTimerId);
    }
    this._awayFromDeskTimerId = null;
  }

  private clearTimerInterval() {
    if (this._timerID !== null) {
      clearInterval(this._timerID);
    }
    this._timerID = null;
  }

  private startTimerInterval() {
    this._startDate = new Date();
    this._timerID = setInterval(this.getTimer.bind(this), this.TIMER_TICK_MS);
  }

  private startCheckAwayFromDeskTimer() {
    this._checkAwayFromDeskTimerId = setInterval(
      this.checkAwayFromDeskTimer.bind(this),
      this.AWAY_CHECK_MS
    );
  }

  private startAwayFromDeskTimer() {
    if (this._awayFromDeskDate === null) {
      this._awayFromDeskDate = new Date();
    }
    if (this._awayFromDeskTimerId !== null) {
      return;
    }
    this._awayFromDeskTimerId = setInterval(this.awayFromDeskTimer.bind(this), this.TIMER_TICK_MS);
  }

  private awayFromDeskTimer() {
    if (this._awayFromDeskDate === null || this._awayFromDeskTimerId === null) {
      return;
    }
    const elapsed = new Date().getTime() - this._awayFromDeskDate.getTime();
    this.setTimerText(formatElapsed(elapsed / 1000));
  }

  // 자리비움체크 1분동안 타이머를 시작하지 않으면 Lost Date 를 설정하고 낭비시간 체크를 시작한다.
  private checkAwayFromDeskTimer() {
    if (this._checkAwayFromDeskTimerId === null) {
      return;
    }

    this.clearCheckAwayFromDeskTimerInterval();
    this._periodType = PeriodType.Lost;
    this.changeTimerTextColorByFocused(this._periodType);
    this.startAwayFromDeskTimer();
    this.setCurrentStateText(this.makeCurrentStateText(this._periodType));
  }

  // 시작시간의 경과시간으로 표시한다.
  private getTimer() {
    if (this._startDate === null || this._currentTimerMinutes === undefined) {
      return;
    }
    let curDate = new Date();
    let elapsed = curDate.getTime() - this._startDate.getTime();
    let focusRemainSeconds = this._budgetSeconds - elapsed / 1000;

    if (focusRemainSeconds < 0) {
      const startedAt = this._startDate;
      const endedAt = new Date();
      this.clearTimerInterval();
      this._startDate = null;
      this.playAlarmSound();
      if (this._periodType === PeriodType.Break) {
        this.incrementFocusCount();
      }
      if (startedAt) {
        this.queueTermChunk(this._periodType, startedAt, endedAt);
      }
      this.flushTermChunks(endedAt);
      this.setStartStopButtonText(this.BTN_START_TEXT);
      const nextPeriodType = this.getNextPeriodType(this._periodType);
      this._currentTimerMinutes = this.getNextTimerMinutes(nextPeriodType, this._focusCount);
      this._awayFromDeskDate = new Date();
      this.setTimerTextColor(this.COLOR_UNMANAGED);
      this.publishProgress(0);
      this.setCurrentStateText('Unmanaged');
      this.startAwayFromDeskTimer();
      this.awayFromDeskTimer();
      this.startCheckAwayFromDeskTimer();
      return;
    }
    this.renderRemain(focusRemainSeconds);
  }

  private remainingSeconds(): number {
    if (this._startDate === null) {
      return Math.max(0, this._budgetSeconds);
    }
    const elapsed = (Date.now() - this._startDate.getTime()) / 1000;
    return Math.max(0, this._budgetSeconds - elapsed);
  }

  private renderRemain(seconds: number) {
    const result = this.convertSecondToTime(Math.max(0, seconds));
    const min = String(result.minutes).padStart(2, '0');
    const sec = String(result.seconds).padStart(2, '0');
    this.setTimerText(`${min}:${sec}`);
    this.publishProgress(seconds);
  }

  private publishProgress(remainSeconds: number) {
    if (this._spanSeconds <= 0) {
      this.setTimerProgress?.(0);
      return;
    }
    const ratio = 1 - Math.max(0, remainSeconds) / this._spanSeconds;
    this.setTimerProgress?.(Math.min(1, Math.max(0, ratio)));
  }

  private pauseTimer() {
    const pausedAt = new Date();
    if (this._startDate) {
      this.queueTermChunk(this._periodType, this._startDate, pausedAt);
    }
    this._budgetSeconds = this.remainingSeconds();
    this.clearTimerInterval();
    this._startDate = null;
    this._pauseStartedAt = pausedAt;
    this._paused = true;
    this.renderRemain(this._budgetSeconds);
    this.setStartStopButtonText(this.BTN_START_TEXT);
  }

  private resumeTimer() {
    const resumedAt = new Date();
    if (this._pauseStartedAt) {
      this.queueTermChunk(PeriodType.Pause, this._pauseStartedAt, resumedAt);
      this._pauseStartedAt = null;
    }
    this.stopAudio();
    this._paused = false;
    this.clearCheckAwayFromDeskTimerInterval();
    this.clearAwayFromDeskTimerInterval();
    this._awayFromDeskDate = null;
    this.startTimerInterval();
    this.setStartStopButtonText(this.BTN_PAUSE_TEXT);
  }

  // 집중 상태에 따른 타이머 컬러설정
  private changeTimerTextColorByFocused(periodType: ActivePeriodTypes) {
    this._shownPeriod = periodType;
    const colors = periodColorsFrom(this._settingsData);
    let colorStr = colors.focusColor;
    switch (periodType)
    {
      case PeriodType.Focus:
        colorStr = colors.focusColor;
        break;
      case PeriodType.Break:
        colorStr = colors.breakColor;
        break;
      case PeriodType.Lost:
        colorStr = colors.lostColor;
        break;
      default:
        break;
    }
    this.setTimerTextColor(colorStr);
    const tone: CardTone =
      periodType === PeriodType.Focus
        ? 'focus'
        : periodType === PeriodType.Break
          ? 'break'
          : 'lost';
    this.setCardTone?.(tone);
  }

  private getNextPeriodType(periodType: ActivePeriodTypes): ActivePeriodTypes {
    return periodType === PeriodType.Focus ? PeriodType.Break : PeriodType.Focus;
  }

  private getNextTimerMinutes(periodType: ActivePeriodTypes, focusCount: number): number {
    if (periodType === PeriodType.Focus) {
      return this._settingsData.focusTime;
    } else if (periodType === PeriodType.Break) {
      return focusCount % this._settingsData.longBreakInterval === 0
        ? this._settingsData.longBreak
        : this._settingsData.shortBreak;
    }
    return this._settingsData.focusTime;
  }

  private incrementFocusCount() {
    this._focusCount = Math.min(this._focusCount + 1, this.MAX_FOCUS_COUNT);
  }

  public startStop() {
    if (this.isTimerRunning()) {
      this.pauseTimer();
      return;
    }
    if (this._paused) {
      this.resumeTimer();
      return;
    }

    if (this._periodType === PeriodType.Lost && this._awayFromDeskDate) {
      let periodType = this.loadLatestPeriodType();
      if (periodType === PeriodType.Focus) {
        this.incrementFocusCount();
      }
      this.saveLocalStorageFocusData(PeriodType.Lost, this._awayFromDeskDate, new Date());
      this._awayFromDeskDate = null;
      this._periodType = PeriodType.Break;
    } else {
      this._awayFromDeskDate = null;
      this._periodType = this.loadLatestPeriodType();
    }

    this.stopAudio();

    this._periodType = this.getNextPeriodType(this._periodType);
    this._currentTimerMinutes = this.getNextTimerMinutes(this._periodType, this._focusCount);
    this.changeTimerTextColorByFocused(this._periodType);
    this.setCurrentStateText(this.makeCurrentStateText(this._periodType));

    this.resetTimer();
    this.clearCheckAwayFromDeskTimerInterval();
    this.clearAwayFromDeskTimerInterval();
  
    this.startTimerInterval();
    this.setStartStopButtonText(this._timerID !== null ? this.BTN_PAUSE_TEXT : this.BTN_START_TEXT);
  }

  private stopTimerInterval() {
    this.clearTimerInterval();
    this._startDate = null;
  }

  private playAlarmSound() {
    if (this.isPlayingAlarmSound() === false) {
      //this.audio.loop = this._periodType === PeriodType.Focus ? true : false;
      void this.audio.play().catch(() => undefined);
    }
    const ended =
      this._periodType === PeriodType.Focus ? 'Focus 끝' : 'Break 끝';
    publishNtfy('뽀모도로', ended);
  }

  private isPlayingAlarmSound(): boolean {
    return !this.audio.paused;
  }

  public stopAudio() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  public dispose() {
    this.clearTimerInterval();
    this.clearCheckAwayFromDeskTimerInterval();
    this.clearAwayFromDeskTimerInterval();
    this.stopAudio();
  }

  public loadSettings() {
    const storedSettings = localStorage.getItem(this.PomodoroSettingsLocalStorageKey);
    if (storedSettings) {
      let parsedSettings: unknown = null;
      try {
        parsedSettings = JSON.parse(storedSettings);
      } catch {
        parsedSettings = null;
      }

      if (this.isValidSettingsData(parsedSettings)) {
        this._settingsData = this.withPeriodColors(parsedSettings);
        this._currentTimerMinutes = this._settingsData.focusTime ? this._settingsData.focusTime : 7;
      } else {
        this._settingsData = this.defaultSettings();
      }
    } else {
      this._settingsData = this.defaultSettings();
    }
  }

  private resetTimer() {
    this.clearTimerInterval();
    this._startDate = null;
    this._paused = false;
    this._pauseStartedAt = null;
    this._termChunks = [];
    this._budgetSeconds = this._currentTimerMinutes * 60;
    this._spanSeconds = this._budgetSeconds;
    const min = String(this._currentTimerMinutes).padStart(2, '0');
    this.setTimerText(`${min}:00`);
    this.publishProgress(this._budgetSeconds);
  }

  private convertSecondToTime(sec: number) {
    const seconds = Math.floor(sec);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return { minutes, seconds: remainingSeconds };
  }
}

export default PomodoroTimer;

// 인스턴스 생성 및 초기화
//const pomodoroTimer = new PomodoroTimer();
