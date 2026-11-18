// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import {setLang} from './i18n/i18n';

// 기존 테스트는 한국어 화면을 기준으로 쓰여 있다. 브라우저 언어와 상관없이 한국어로 시작한다.
beforeEach(() => {
  setLang('ko', false);
});
