# momentum_card 보안 점검 보고서

## 1) 점검 개요
- 점검 일시: 2026-06-18
- 점검 범위: `src/`, `package.json`, 런타임 네트워크 호출/저장소 사용 패턴, 의존성 취약점
- 점검 방식:
  - 정적 코드 리뷰 (클라이언트 코드 기준)
  - 의존성 취약점 스캔 (`npm audit --omit=dev --json`)

## 2) 요약
- 확인된 주요 이슈: 5건
  - 높음(High): 2건
  - 중간(Medium): 2건
  - 낮음(Low): 1건
- 의존성 취약점 스캔 결과:
  - 총 55건 (High 23 / Moderate 19 / Low 13)

## 3) 상세 이슈

### [High] 클라이언트 코드 내 API 키 하드코딩
- 위치: `src/components/Weather.tsx:20`
- 근거: OpenWeather API 키가 코드에 평문으로 포함됨
- 위험:
  - 빌드 결과물/소스 노출 시 키 유출
  - 무단 호출로 과금/쿼터 고갈 가능
- 권장 조치:
  - 프론트엔드에 비밀키를 직접 두지 말고, 서버(백엔드/서버리스) 프록시를 통해 호출
  - 키는 서버 환경변수로 관리하고 도메인/IP/리퍼러 제한 및 회전 정책 적용

### [High] 의존성 취약점 다수 (공급망 리스크)
- 위치: `package.json:23`, `package.json:24`, `package.json:16`
- 근거:
  - `react-router-dom` 버전 대역 취약점 포함 (audit 결과 High 다수)
  - `react-scripts@5.0.1` 생태계 체인에서 다수 취약점 전파
  - `postcss` 관련 취약점 경고 확인
- 위험:
  - 개발/빌드/런타임 체인에서 알려진 취약점 노출
  - 향후 기능 추가 시 공격면 확대 가능
- 권장 조치:
  - `react-router-dom` 최신 안전 버전으로 우선 업데이트
  - CRA(`react-scripts`) 의존 구조를 최신 스택(Vite 등)으로 전환 검토
  - 주기적 `npm audit` + CI 차단 정책(High 이상 실패 처리) 적용

### [Medium] 위치정보/외부 API 응답의 콘솔 로깅
- 위치:
  - `src/components/Weather.tsx:33`
  - `src/components/Weather.tsx:54`
  - `src/routes/Detail.tsx:8`
  - `src/routes/Detail.tsx:14`
  - `src/CoinListApp.tsx:21`
- 근거: 위도/경도, API 응답 객체, 라우트 파라미터 등을 콘솔에 출력
- 위험:
  - 공용 환경/원격 디버깅 환경에서 정보 노출 가능
  - 개인정보(위치) 로그 잔존
- 권장 조치:
  - 운영 빌드에서 민감 로그 제거
  - 필요 시 로깅 래퍼를 두고 `NODE_ENV` 기반 마스킹/비활성화

### [Medium] 위치정보 갱신 인터벌의 정리(cleanup) 누락
- 위치:
  - `src/components/Weather.tsx:27`
  - `src/components/Weather.tsx:44`
- 근거: `setInterval` 생성 후 `clearInterval` 정리 로직 없음
- 위험:
  - 컴포넌트 생명주기 이후에도 요청이 지속되어 불필요 트래픽/리소스 사용
  - 개인정보(위치) 갱신이 의도보다 오래 지속될 가능성
- 권장 조치:
  - `useEffect`에서 인터벌 ID를 저장하고 cleanup에서 `clearInterval` 실행
  - 권한 거부/실패 시 재시도 정책, 최소 수집 원칙(주기 축소/옵트인) 적용

### [Low] localStorage 역직렬화 데이터 검증 부재
- 위치:
  - `src/PomodoroTimer.ts:166`
  - `src/PomodoroTimer.ts:382`
- 근거: `JSON.parse(localStorage.getItem(...))` 결과에 대한 스키마 검증 없음
- 위험:
  - 변조/손상된 저장값으로 런타임 예외 발생 가능 (가용성 저하)
- 권장 조치:
  - `try/catch` + 타입 가드(스키마 검증) 적용
  - 유효하지 않은 데이터는 초기화 후 안전 기본값 사용

## 4) 확인된 양호 사항
- `target="_blank"` 링크에 `rel="noopener noreferrer"` 적용 확인
  - 위치: `src/App.tsx:31`
- `dangerouslySetInnerHTML`, `eval`, `new Function` 사용 흔적 미확인

## 5) 우선순위 대응 권장안
1. API 키 즉시 무효화/교체 및 서버 프록시 구조로 이전
2. `react-router-dom` 및 핵심 빌드 체인 의존성 업데이트
3. 민감 콘솔 로그 제거, 위치정보 수집 로직의 cleanup 보강
4. localStorage 파싱 방어코드(검증/예외처리) 추가

## 6) 비고
- 본 프로젝트는 프론트엔드 중심 구조로 보이며, 서버측 인증/인가/비밀관리 로직은 점검 범위 밖입니다.
- 의존성 취약점은 패키지 조합/실행 경로에 따라 실제 악용 가능성이 달라질 수 있으므로, 업데이트 후 재스캔으로 재평가가 필요합니다.

## 7) 조치 완료 여부 (2026-06-18)
- [완료] [High] 클라이언트 코드 내 API 키 하드코딩
  - 조치: `src/components/Weather.tsx`에서 OpenWeather 하드코딩 키 제거
  - 조치: 키가 필요 없는 API(Open-Meteo) + 역지오코딩으로 교체
- [완료] [Medium] 위치정보/외부 API 응답의 콘솔 로깅
  - 조치: `src/components/Weather.tsx`, `src/routes/Detail.tsx`, `src/CoinListApp.tsx`의 민감 로그 제거
- [완료] [Medium] 위치정보 갱신 인터벌 cleanup 누락
  - 조치: `src/components/Weather.tsx`에 interval ref/cleanup(`clearInterval`) 추가
- [완료] [Low] localStorage 역직렬화 데이터 검증 부재
  - 조치: `src/PomodoroTimer.ts`에 `try/catch` + 타입 가드 검증 로직 추가
- [완료(운영 기준)] [High] 의존성 취약점 다수 (공급망 리스크)
  - 조치: 직접 의존성 업데이트 (`react-router-dom`, `postcss`)
  - 조치: 빌드/배포 도구(`react-scripts`, `gh-pages`, `tailwindcss`, `autoprefixer`, `postcss`)를 `devDependencies`로 분리
  - 검증: `npm audit --omit=dev` 결과 `found 0 vulnerabilities`
  - 참고: 전체(`dev` 포함) audit는 CRA 체인 특성상 취약점이 일부 잔존

## 8) 테스트 및 배포 결과
- 테스트: `npm test -- --watchAll=false --runInBand` 통과
  - 결과: `Test Suites: 1 passed, 1 total`
- 빌드: `npm run build` 성공 (ESLint warning 존재, 빌드 산출물 생성)
- 배포: `npm run deploy` 성공
  - 결과: `Published`
