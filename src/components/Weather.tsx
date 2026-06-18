import React, { useEffect, useRef, useState } from 'react';
import styles from '../css/Weather.module.css';

interface WeatherInfoMap {
  temperature: number;
  feelsLike?: number;
  location: string;
}

function Weather() {
  const API_REFRESH_TIME = 60 * 60 * 1000;

  const [weatherInfo, setWeatherInfo] = useState<WeatherInfoMap | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const refreshTimerRef = useRef<number | null>(null);

  const resolveLocationName = async (lat: number, lon: number) => {
    try {
      const geoResponse = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ko`
      );
      if (!geoResponse.ok) {
        return `(${lat.toFixed(3)}, ${lon.toFixed(3)})`;
      }

      const geoData = await geoResponse.json();
      return (
        geoData.city ||
        geoData.locality ||
        geoData.principalSubdivision ||
        `(${lat.toFixed(3)}, ${lon.toFixed(3)})`
      );
    } catch {
      return `(${lat.toFixed(3)}, ${lon.toFixed(3)})`;
    }
  };

  const onGeoOk = async (position: GeolocationPosition) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    try {
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature`
      );

      if (!weatherResponse.ok) {
        throw new Error('Failed to fetch weather');
      }

      const weatherData = await weatherResponse.json();
      const location = await resolveLocationName(lat, lon);

      setWeatherInfo({
        temperature: weatherData?.current?.temperature_2m,
        feelsLike: weatherData?.current?.apparent_temperature,
        location,
      });
      setErrorMessage('');
    } catch {
      setErrorMessage('날씨 정보를 불러오지 못했습니다.');
    }
  };
  const repeatObtainWeatherInfo = (position: GeolocationPosition) => {
    onGeoOk(position);
    refreshTimerRef.current = window.setInterval(
      () => onGeoOk(position),
      API_REFRESH_TIME
    );
  };

  const onGeoError = () => {
    setErrorMessage('위치 권한이 필요합니다. 브라우저 권한을 확인해 주세요.');
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setErrorMessage('이 브라우저는 위치 정보를 지원하지 않습니다.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      repeatObtainWeatherInfo,
      onGeoError
    );
    return () => {
      if (refreshTimerRef.current !== null) {
        window.clearInterval(refreshTimerRef.current);
      }
    };
  }, [API_REFRESH_TIME]);

  if (errorMessage) {
    return <div className={styles.rootDiv}>{errorMessage}</div>;
  }

  return (
    <div className={styles.rootDiv}>
      <h3>
        {`🌡️${weatherInfo?.temperature ?? '-'} `} @{weatherInfo?.location ?? '위치 확인 중'}
      </h3>
      <p>{`체감온도: ${weatherInfo?.feelsLike ?? '-'}°C`}</p>
    </div>
  );
}

export default Weather;
