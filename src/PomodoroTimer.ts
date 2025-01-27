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

class PomodoroTimer {
  private audio: HTMLAudioElement;

  private _timerID: NodeJS.Timeout | null = null;
  private _startDate: Date | null = null;
  private _currentTimerMin: number = 25;
  private _focusCount: number = 1;
  private _isFocused: boolean = false;
  
  private readonly FOCUS_MIN: number = 1;//25;
  private readonly SHORT_BREAK_MIN: number = 1;//5;
  private readonly LONG_BREAK_MIN: number = 15;
  private readonly LONG_BREAK_INTERVAL: number = 4;
  private readonly BTN_START_TEXT: string = 'Start';
  private readonly BTN_STOP_TEXT: string = 'Stop';
  private readonly COLOR_FOCUS: string = 'black';
  private readonly COLOR_BREAK: string = 'deeppink';
  private readonly PomodoroFocusLocalStorageKey: string = 'PomodoroFocusData';
  private readonly PomodoroSettingsLocalStorageKey: string = 'PomodoroSettings';

  private _currentFocusData!: { dateId: string; focusCount: number };
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
    this._focusCount = this.loadLocalStorageFocusData(this.PomodoroFocusLocalStorageKey);
    this.loadSettings();
    this._currentTimerMin = this.getNextTimerMinutes(this._focusCount);

    document.addEventListener('keydown', (event: KeyboardEvent) => {
      if (event.altKey && event.code === 'KeyA') {
        this.stopAudio();
      } else if (event.altKey && event.code === 'KeyS') {
        this.startStop();
      }
      //else if (event.code === "Escape" && !this.modalLayer.classList.contains('hidden')) {
      //    this.modalControl(event);
      //}
    });
  }

  private modalControl(e: Event) {
    e.preventDefault();
    //this.modalLayer?.classList.toggle('hidden');
    //this.overlay?.classList.toggle('hidden');
  }

  private saveLocalStorageFocusData(key: string, data: { dateId: string; focusCount: number }) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  public saveLocalStorageSettings(settings: TimerSettings) {
    this._settingsData = settings;
    this._currentTimerMin = settings.focusTime ? settings.focusTime : 7;
    localStorage.setItem(this.PomodoroSettingsLocalStorageKey, JSON.stringify(settings));
  }

  private loadLocalStorageFocusData(key: string): number {
    let rtn = 1;
    if (localStorage.getItem(key)) {
      this._currentFocusData = JSON.parse(localStorage.getItem(key)!);
      let now = new Date();
      let dateId = [now.getFullYear(), now.getMonth() + 1, now.getDate()].join('-');
      if (dateId === this._currentFocusData.dateId) {
        rtn = this._currentFocusData.focusCount;
      }
    }
    return rtn;
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
    this.setTimerTextColor(this._isFocused ? this.COLOR_FOCUS : this.COLOR_BREAK);
  }

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
      this._currentTimerMin = this.getNextTimerMinutes(this._focusCount);
      if (this._isFocused) {
        ++this._focusCount;
        const now = new Date();
        let saveData = {
          dateId: [now.getFullYear(), now.getMonth() + 1, now.getDate()].join('-'),
          focusCount: this._focusCount,
        };
        this.saveLocalStorageFocusData(this.PomodoroFocusLocalStorageKey, saveData);
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

  private playAlarmSound() {
    this.audio.loop = this._isFocused;
    this.audio.play();
  }

  private getNextTimerMinutes(focusCount: number): number {
    this._isFocused = !this._isFocused;
    if (this._isFocused) {
      return this._settingsData.focusTime;
    } else {
      return focusCount % this._settingsData.longBreakInterval === 0
        ? this._settingsData.longBreak
        : this._settingsData.shortBreak;
    }
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
