interface PomodoroTimerProps {
  setTimerText: (timer: string) => void;
  setFocusIndex: (index: number) => void;
  setStartStopButtonText: (text: string) => void;
  setTimerTextColor: (color: string) => void;
}

export type TimerSettings = {
  focusTime: number;
  shortBreak: number;
  longBreak: number;
  longBreakInterval: number;
}

const PeriodType = {
  Focus: "Focus", // Focus Time
  Break: "Break", // Break Time
  Lost: "Lost",  // Lost Time
} as const;
type PeriodTypes = (typeof PeriodType)[keyof typeof PeriodType];

type PeriodData = {
  periodType: PeriodTypes;
  startDate: Date;
  finishDate: Date;
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
  private _currentTimerMin: number = 25;
  private _focusCount: number = 1;
  private _periodType: PeriodTypes = PeriodType.Focus;
  private _timePeriod: Array<string> = [];
  
  private readonly FOCUS_MIN: number = 25;
  private readonly SHORT_BREAK_MIN: number = 5;
  private readonly LONG_BREAK_MIN: number = 15;
  private readonly LONG_BREAK_INTERVAL: number = 4;
  private readonly BTN_START_TEXT: string = 'Start';
  private readonly BTN_STOP_TEXT: string = 'Stop';
  private readonly COLOR_FOCUS: string = 'black';
  private readonly COLOR_BREAK: string = 'deeppink';
  private readonly COLOR_LOST: string = 'red';
  private readonly PomodoroFocusLocalStorageKey: string = 'PomodoroFocusData';
  private readonly PomodoroSettingsLocalStorageKey: string = 'PomodoroSettings';

  private _settingsData!: TimerSettings;

  private setTimerText: (timer: string) => void;
  private setFocusIndex: (index: number) => void;
  private setStartStopButtonText: (text: string) => void;
  private setTimerTextColor: (color: string) => void;

  constructor({setTimerText, setFocusIndex, setStartStopButtonText, setTimerTextColor} : PomodoroTimerProps) {
    this.setTimerText = setTimerText;
    this.setFocusIndex = setFocusIndex;
    this.setStartStopButtonText = setStartStopButtonText;
    this.setTimerTextColor = setTimerTextColor;

    this.audio = new Audio(`${process.env.PUBLIC_URL}/alarmSound.mp3`);

    this.init();
  }

  public getSettings() {
    return this._settingsData;
  }

  private init() {
    this.loadLocalStorageFocusData();

    // 최근 상태 로드
    if (this._timePeriod.length > 0) {
      let periodData = this.parseStringToPeriodData(this._timePeriod[this._timePeriod.length - 1]);
      this._periodType = periodData.periodType;
      this.changeNextPeriodType();
    }

    this.setFocusIndex(this._focusCount);
    this.loadSettings();
    this._currentTimerMin = this.getNextTimerMinutes(this._focusCount);

    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.altKey && event.code === 'KeyA') {
        this.stopAudio();
      } else if (event.altKey && event.code === 'KeyS') {
        this.startStop();
      }
    });
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

  private saveLocalStorageFocusData() {
    if (this._startDate) {
      let now = new Date();
      let periodStr = this.makeDateTimePeriodString(this._periodType, this._startDate, now);
      this._timePeriod.push(periodStr);
      let saveData = {
        dateId: [this._startDate.getFullYear(), this._startDate.getMonth() + 1, this._startDate.getDate()].join('-'),
        focusCount: this._focusCount,
        focusPeriod: this._timePeriod
      };

      localStorage.setItem(this.PomodoroFocusLocalStorageKey, JSON.stringify(saveData));
    }
  }

  private loadLocalStorageFocusData() {
    this._focusCount = 1;
    if (localStorage.getItem(this.PomodoroFocusLocalStorageKey)) {
      let loadFocusData: { dateId: string; focusCount: number, focusPeriod: Array<string> };
      loadFocusData = JSON.parse(localStorage.getItem(this.PomodoroFocusLocalStorageKey)!);
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
    this._settingsData = settings;
    this._currentTimerMin = settings.focusTime ? settings.focusTime : 7;
    localStorage.setItem(this.PomodoroSettingsLocalStorageKey, JSON.stringify(settings));
  }

  private isTimerRunning() {
    return this._timerID !== null;
  }

  private clearTimerInterval() {
    if (this._timerID !== null) {
      clearInterval(this._timerID);
    }
    this._timerID = null;
  }

  private startTimerInterval() {
    this._startDate = new Date();
    this._timerID = setInterval(this.getTimer.bind(this), 300);
  }

  // 집중 상태에 따른 타이머 컬러설정
  private changeTimerTextColorByFocused() {
    let colorStr = this.COLOR_FOCUS;
    switch (this._periodType)
    {
      case PeriodType.Focus:
        colorStr = this.COLOR_FOCUS;
        break;
      case PeriodType.Break:
        colorStr = this.COLOR_BREAK;
        break;
      case PeriodType.Lost:
        colorStr = this.COLOR_FOCUS;
        break;
      default:
        break;
    }
    this.setTimerTextColor(colorStr);
  }

  // 시작시간의 경과시간으로 표시한다.
  private getTimer() {
    if (this._startDate === null || this._currentTimerMin === undefined) {
      return;
    }
    let curDate = new Date();
    let elapsed = curDate.getTime() - this._startDate.getTime();
    let focusRemainSeconds = this._currentTimerMin * 60 - elapsed / 1000;

    if (focusRemainSeconds < 0) {
      this.clearTimerInterval();
      this.playAlarmSound();
      this.saveLocalStorageFocusData();
      this.changeNextPeriodType();
      this._currentTimerMin = this.getNextTimerMinutes(this._focusCount);
      if (this._periodType === PeriodType.Focus) {
        ++this._focusCount;
      }
      this.setStartStopButtonText(this._timerID !== null ? this.BTN_STOP_TEXT : this.BTN_START_TEXT);
      this.setFocusIndex(this._focusCount);
      this.changeTimerTextColorByFocused();
      this.reset();
      return;
    }
    let result = this.convertSecondToTime(focusRemainSeconds);
    const min = String(result.minutes).padStart(2, '0');
    const sec = String(result.seconds).padStart(2, '0');

    this.setTimerText(`${min}:${sec}`);
  }

  private changeNextPeriodType() {
    this._periodType = this._periodType === PeriodType.Focus ? PeriodType.Break : PeriodType.Focus;
  }

  private getNextTimerMinutes(focusCount: number): number {
    if (this._periodType === PeriodType.Focus) {
      return this._settingsData.focusTime;
    } else if (this._periodType === PeriodType.Break) {
      return focusCount % this._settingsData.longBreakInterval === 0
        ? this._settingsData.longBreak
        : this._settingsData.shortBreak;
    }
    return 77;
  }

  public startStop() {
    if (this.isTimerRunning()) {
      this.stop();
    } else {
      this.reset();
      this.startTimerInterval();
    }
    this.setStartStopButtonText(this._timerID !== null ? this.BTN_STOP_TEXT : this.BTN_START_TEXT);
    this.changeTimerTextColorByFocused();
    this.stopAudio();
  }

  private stop() {
    this.clearTimerInterval();
    this._startDate = null;
  }

  private playAlarmSound() {
    if (this.isPlayingAlarmSound() === false) {
      this.audio.loop = this._periodType === PeriodType.Focus ? true : false;
      this.audio.play();
    }
  }

  private isPlayingAlarmSound(): boolean {
    return !this.audio.paused;
  }

  public stopAudio() {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  public loadSettings() {
    if (localStorage.getItem(this.PomodoroSettingsLocalStorageKey)) {
      this._settingsData = JSON.parse(
        localStorage.getItem(this.PomodoroSettingsLocalStorageKey)!
      );
      this._currentTimerMin = this._settingsData.focusTime ? this._settingsData.focusTime : 7;
    } else {
      this._settingsData = {
        focusTime: this.FOCUS_MIN,
        shortBreak: this.SHORT_BREAK_MIN,
        longBreak: this.LONG_BREAK_MIN,
        longBreakInterval: this.LONG_BREAK_INTERVAL,
      };
    }
  }

  private reset() {
    this.clearTimerInterval();
    this._startDate = null;
    const min = String(this._currentTimerMin).padStart(2, '0');
    this.setTimerText(`${min}:00`);
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
