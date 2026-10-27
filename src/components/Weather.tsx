import React, {useEffect, useState} from 'react';
import styles from '../css/Weather.module.css';

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

function Weather() {
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

  if (errorMessage) {
    return <div className={styles.rootDiv}>{errorMessage}</div>;
  }

  return (
    <div className={styles.rootDiv}>
      <h3>
        {`🌡️${weatherInfo?.temperature ?? '-'} `} @
        {weatherInfo?.location ?? '위치 확인 중'}
      </h3>
      <p>{`체감온도: ${weatherInfo?.feelsLike ?? '-'}°C`}</p>
    </div>
  );
}

export default Weather;
