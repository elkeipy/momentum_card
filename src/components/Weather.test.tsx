import React from 'react';
import {render, screen} from '@testing-library/react';
import Weather from './Weather';

test('explains when geolocation is unavailable', () => {
  const descriptor = Object.getOwnPropertyDescriptor(navigator, 'geolocation');
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: undefined
  });

  render(<Weather />);
  expect(screen.getByText('이 브라우저는 위치 정보를 지원하지 않습니다.')).toBeInTheDocument();

  if (descriptor) {
    Object.defineProperty(navigator, 'geolocation', descriptor);
  }
});
