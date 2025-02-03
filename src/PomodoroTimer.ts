interface PomodoroTimerProps {
  setTimerText: (timer: string) => void;
  setCurrentStateText: (index: string) => void;
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
  private _awayFromDeskDate: Date | null = null;
  private _checkAwayFromDeskTimerId: NodeJS.Timeout | null = null;
  private _awayFromDeskTimerId: NodeJS.Timeout | null = null;
  private _currentTimerMinutes: number = 25;
  private _focusCount: number = 1;
  private _periodType: PeriodTypes = PeriodType.Break;
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
  private setCurrentStateText: (index: string) => void;
  private setStartStopButtonText: (text: string) => void;
  private setTimerTextColor: (color: string) => void;

  constructor({setTimerText, setCurrentStateText, setStartStopButtonText, setTimerTextColor} : PomodoroTimerProps) {
    this.setTimerText = setTimerText;
    this.setCurrentStateText = setCurrentStateText;
    this.setStartStopButtonText = setStartStopButtonText;
    this.setTimerTextColor = setTimerTextColor;

    this.audio = new Audio(`${process.env.PUBLIC_URL}/alarmSound.mp3`);

    this.init();
  }

  public getSettings() {
    return this._settingsData;
  }

  private loadLatestPeriodType(): PeriodTypes {
    let periodType: PeriodTypes = PeriodType.Break;
    if (this._timePeriod.length > 0) {
      let periodData = this.parseStringToPeriodData(this._timePeriod[this._timePeriod.length - 1]);
      return periodData.periodType;
    }

    return periodType;
  }

  private existSavedPeriodData(): boolean {
    return this._timePeriod.length > 0;
  }

  private init() {
    this.loadLocalStorageFocusData();
    let nextPeriodType: PeriodTypes = PeriodType.Focus;
    if (this.existSavedPeriodData()) {
      nextPeriodType = this.getNextPeriodType(this.loadLatestPeriodType());
      this.changeTimerTextColorByFocused(nextPeriodType);
    }
    this.setCurrentStateText(this.makeCurrentStateText(nextPeriodType));
    this.loadSettings();
    this._currentTimerMinutes = this.getNextTimerMinutes(this._periodType, this._focusCount);
  }

  private makeCurrentStateText(periodType: PeriodTypes): string {
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

  private saveLocalStorageFocusData(periodType: PeriodTypes, startDate: Date, finishDate: Date) {
    if (startDate && finishDate) {
      let periodStr = this.makeDateTimePeriodString(periodType, startDate, finishDate);
      this._timePeriod.push(periodStr);
      let saveData = {
        dateId: [startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()].join('-'),
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
    this._currentTimerMinutes = settings.focusTime ? settings.focusTime : 7;
    localStorage.setItem(this.PomodoroSettingsLocalStorageKey, JSON.stringify(settings));
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
    this._timerID = setInterval(this.getTimer.bind(this), 300);
  }

  private startCheckAwayFromDeskTimer() {
    this._checkAwayFromDeskTimerId = setInterval(this.checkAwayFromDeskTimer.bind(this), 60 * 1000);
  }

  private startAwayFromDeskTimer() {
    this._awayFromDeskDate = new Date();
    this._awayFromDeskTimerId = setInterval(this.awayFromDeskTimer.bind(this), 300);
  }

  private awayFromDeskTimer() {
    // 자리비움을 계속 확인하며 자리비움 시간을 표시한다.
    if (this._awayFromDeskDate === null || this._awayFromDeskTimerId === null) {
      return;
    }

    let curDate = new Date();
    let elapsed = curDate.getTime() - this._awayFromDeskDate.getTime();
    let result = this.convertSecondToTime(elapsed / 1000);
    const min = String(result.minutes).padStart(2, '0');
    const sec = String(result.seconds).padStart(2, '0');

    this.setTimerText(`${min}:${sec}`);
  }

  // 자리비움체크 1분동안 타이머를 시작하지 않으면 Lost Date 를 설정하고 낭비시간 체크를 시작한다.
  private checkAwayFromDeskTimer() {
    if (this._checkAwayFromDeskTimerId === null) {
      return;
    }

    this.clearCheckAwayFromDeskTimerInterval();

    console.log("start away from desk timer");

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
    let focusRemainSeconds = this._currentTimerMinutes * 60 - elapsed / 1000;

    if (focusRemainSeconds < 0) {
      this.startCheckAwayFromDeskTimer();
      this.playAlarmSound();
      if (this._periodType === PeriodType.Break) {
        ++this._focusCount;
      }
      this.saveLocalStorageFocusData(this._periodType, this._startDate, new Date());
      this.setStartStopButtonText(this.BTN_START_TEXT);

      let nextPeriodType: PeriodTypes = this.getNextPeriodType(this._periodType);
      this.setCurrentStateText(this.makeCurrentStateText(nextPeriodType));
      this.changeTimerTextColorByFocused(nextPeriodType);
      this._currentTimerMinutes = this.getNextTimerMinutes(nextPeriodType, this._focusCount);
      this.resetTimer();
      return;
    }
    let result = this.convertSecondToTime(focusRemainSeconds);
    const min = String(result.minutes).padStart(2, '0');
    const sec = String(result.seconds).padStart(2, '0');

    this.setTimerText(`${min}:${sec}`);
  }

  // 집중 상태에 따른 타이머 컬러설정
  private changeTimerTextColorByFocused(periodType: PeriodTypes) {
    let colorStr = this.COLOR_FOCUS;
    switch (periodType)
    {
      case PeriodType.Focus:
        colorStr = this.COLOR_FOCUS;
        break;
      case PeriodType.Break:
        colorStr = this.COLOR_BREAK;
        break;
      case PeriodType.Lost:
        colorStr = this.COLOR_LOST;
        break;
      default:
        break;
    }
    this.setTimerTextColor(colorStr);
  }

  private getNextPeriodType(periodType: PeriodTypes): PeriodTypes {
    let rtnPeriodType: PeriodTypes = PeriodType.Break;
    rtnPeriodType = periodType === PeriodType.Focus ? PeriodType.Break : PeriodType.Focus;
    return rtnPeriodType;
  }

  private getNextTimerMinutes(periodType: PeriodTypes, focusCount: number): number {
    if (periodType === PeriodType.Focus) {
      return this._settingsData.focusTime;
    } else if (periodType === PeriodType.Break) {
      return focusCount % this._settingsData.longBreakInterval === 0
        ? this._settingsData.longBreak
        : this._settingsData.shortBreak;
    }
    return 77;
  }

  public startStop() {
    if (this._periodType === PeriodType.Lost && this._awayFromDeskDate) {
      let periodType = this.loadLatestPeriodType();
      if (periodType === PeriodType.Focus) {
        ++this._focusCount;
      }
      this.saveLocalStorageFocusData(PeriodType.Lost, this._awayFromDeskDate, new Date());
      this._awayFromDeskDate = null;
      this._periodType = PeriodType.Break;
    } else {
      this._periodType = this.loadLatestPeriodType();
    }

    if (this.isTimerRunning()) {
      this.stopTimerInterval();
      this.setStartStopButtonText(this.BTN_START_TEXT);
      return;
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
    this.setStartStopButtonText(this._timerID !== null ? this.BTN_STOP_TEXT : this.BTN_START_TEXT);
  }

  private stopTimerInterval() {
    this.clearTimerInterval();
    this._startDate = null;
  }

  private playAlarmSound() {
    if (this.isPlayingAlarmSound() === false) {
      //this.audio.loop = this._periodType === PeriodType.Focus ? true : false;
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
      this._currentTimerMinutes = this._settingsData.focusTime ? this._settingsData.focusTime : 7;
    } else {
      this._settingsData = {
        focusTime: this.FOCUS_MIN,
        shortBreak: this.SHORT_BREAK_MIN,
        longBreak: this.LONG_BREAK_MIN,
        longBreakInterval: this.LONG_BREAK_INTERVAL,
      };
    }
  }

  private resetTimer() {
    this.clearTimerInterval();
    this._startDate = null;
    const min = String(this._currentTimerMinutes).padStart(2, '0');
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
