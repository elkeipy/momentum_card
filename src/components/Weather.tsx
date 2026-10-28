import React, {useEffect, useState} from 'react';
import {REFRESH_SEC_DEFAULT, WEATHER_FONT_DEFAULT} from '../featureCard/cardSettings';
import {useDisplaySettings} from '../featureCard/useDisplaySettings';
import styles from '../css/Weather.module.css';
import DisplaySettingsFields from './DisplaySettingsFields';
import SettingsModal from './SettingsModal';

interface WeatherInfoMap {
  temperature: number | null;
  feelsLike: number | null;
  location: string;
}

const WEATHER_REFRESH_MS = 60 * 60 * 1000;
const GEO_DECIMAL_PLACES = 2;
const MAX_LOCATION_LENGTH = 80;
const UNKNOWN_LOCATION = '알 수 없는 위치';

function roundCoordinate(value: number): number {
  const factor = 10 ** GEO_DECIMAL_PLACES;
  return Math.round(value * factor) / factor;
}

function readTemperature(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readLocationName(value: unknown): string {
  if (typeof value !== 'string') {
    return UNKNOWN_LOCATION;
  }
  const cleaned = Array.from(value)
    .filter(char => {
      const code = char.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join('')
    .trim();
  if (!cleaned) {
    return UNKNOWN_LOCATION;
  }
  return cleaned.slice(0, MAX_LOCATION_LENGTH);
}

const WEATHER_DEFAULTS = {
  fontSize: WEATHER_FONT_DEFAULT,
  refreshSec: REFRESH_SEC_DEFAULT
};

function Weather() {
  const settings = useDisplaySettings('weather', WEATHER_DEFAULTS);
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfoMap | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let isActive = true;
    let refreshTimerId: number | null = null;

    const resolveLocationName = async (lat: number, lon: number) => {
      try {
        const geoResponse = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ko`
        );
        if (!geoResponse.ok) {
          return UNKNOWN_LOCATION;
        }
        const geoData: unknown = await geoResponse.json();
        if (!geoData || typeof geoData !== 'object') {
          return UNKNOWN_LOCATION;
        }
        const place = geoData as {
          city?: unknown;
          locality?: unknown;
          principalSubdivision?: unknown;
        };
        return readLocationName(
          place.city || place.locality || place.principalSubdivision
        );
      } catch {
        return UNKNOWN_LOCATION;
      }
    };

    const loadWeather = async (lat: number, lon: number) => {
      try {
        const weatherResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature`
        );
        if (!weatherResponse.ok) {
          throw new Error('Failed to fetch weather');
        }
        const weatherData: unknown = await weatherResponse.json();
        const current =
          weatherData &&
          typeof weatherData === 'object' &&
          'current' in weatherData
            ? (weatherData.current as {temperature_2m?: unknown; apparent_temperature?: unknown})
            : undefined;
        const location = await resolveLocationName(lat, lon);
        if (!isActive) {
          return;
        }
        setWeatherInfo({
          temperature: readTemperature(current?.temperature_2m),
          feelsLike: readTemperature(current?.apparent_temperature),
          location
        });
        setErrorMessage('');
      } catch {
        if (isActive) {
          setErrorMessage('날씨 정보를 불러오지 못했습니다.');
        }
      }
    };

    const startRefresh = (position: GeolocationPosition) => {
      if (!isActive) {
        return;
      }
      const lat = roundCoordinate(position.coords.latitude);
      const lon = roundCoordinate(position.coords.longitude);
      void loadWeather(lat, lon);
      refreshTimerId = window.setInterval(() => {
        void loadWeather(lat, lon);
      }, WEATHER_REFRESH_MS);
    };

    if (!navigator.geolocation) {
      setErrorMessage('이 브라우저는 위치 정보를 지원하지 않습니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(startRefresh, () => {
      if (isActive) {
        setErrorMessage('위치 권한이 필요합니다. 브라우저 권한을 확인해 주세요.');
      }
    });

    return () => {
      isActive = false;
      if (refreshTimerId !== null) {
        window.clearInterval(refreshTimerId);
      }
    };
  }, []);

  const settingsModal = settings.isOpen ? (
    <SettingsModal title="날씨 설정" onSave={settings.save} onClose={settings.close}>
      <DisplaySettingsFields value={settings.draft} onChange={settings.setDraft} />
    </SettingsModal>
  ) : null;

  if (errorMessage) {
    return (
      <>
        <p className={styles.error}>{errorMessage}</p>
        {settingsModal}
      </>
    );
  }

  const temperature = weatherInfo?.temperature;
  const feelsLike = weatherInfo?.feelsLike;

  return (
    <div className={styles.rootDiv}>
      <p className={styles.place}>{weatherInfo?.location ?? '위치 확인 중'}</p>
      {typeof temperature === 'number' ? (
        <p className={styles.temp} style={{fontSize: `${settings.saved.fontSize}px`}}>
          <span className="num">{temperature}</span>
          <span className={styles.unit}>°C</span>
        </p>
      ) : (
        <p className={styles.missing}>—</p>
      )}
      <p className={styles.meta}>
        {typeof feelsLike === 'number' ? `체감온도: ${feelsLike}°C` : '체감온도: —'}
      </p>
      {settingsModal}
    </div>
  );
}

export default Weather;
