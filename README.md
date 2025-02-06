# Momentum Card
1. 프로젝트 생성
- npx create-react-app my-project --template typescript
- `create-react-app` 명령어로 생성하지 않고 따로 `React` 설치
  - npm install react react-dom @types/react @types/react-dom
> `create-react-app` 명령어로 프로젝트 생성시 `babel` 이 자동설치되어 `.tsx` 를 브라우저가 인식할 수 있는 코드로 자동 변환
- cd my-project

2. Tailwind CSS 설치
- npm install -D tailwindcss postcss autoprefixer
- npx tailwindcss init -p

3.  Tailwind CSS 설정
``` json
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

4. CSS 파일에 Tailwind 지시어 추가 (index.css) : 아직 미적용
``` css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

5. web-vitals 설치 (미사용)
- npm install --save-dev web-vitals

6. 프로젝트 실행
- npm start

## 샘플
> https://github.com/sbjang123456/react-draggable-resize-modal/tree/main

## React Overview/API Reference (한글)
> https://ko.react.dev/  
> https://ko.react.dev/reference/reacts

### React 정리
- useState : 변경된것만 다시 그려줌 (reRender)
  - 하지만 컴포넌트의 state 를 변경하면 모든 자식 컴포넌트도 reRender 를 진행하게됨
  - 그때 사용하는것이 useMemo (memorized) : MemorizedBtn 참고
  ```tsx
  function Btn(props: any) {
    ...
  }
  const MemorizedBtn = React.memo(Btn);
  ```
  - let 변수를 사용하지 않고 useState 를 사용하는 본질은 React 가 UI 를 자동 업데이트 하냐는것!
- useEffect
  - 한번만 실행 []
  - dependencies 를 주어 원할때만 실행 [counter]
  - cleanup : 함수에서 return 할때의 함수, 소멸자 느낌?
***

## 배포 (gh-pages)
github 에서 간략한 웹퍼브리싱을 지원하는 도구?
### 설치
`npm i gh-pages`
### 설정(package.json)
```
"scripts": {
    ...
    "deploy": "gh-pages -d build",
    "predeploy": "npm run build"
  },
"homepage": "https://elkeipy.github.io/momentum_card"
```
> npm run build : build 폴더가 생성되며 압축 및 최적화

### 실행(배포)
`npm run deploy`

### 참고
Lorem Picsum
```
Easy to use, stylish placeholders
Just add your desired image size (width & height) after our URL, and you'll get a random image.

https://picsum.photos/200/300
```

# 토모도로 타이머, 날씨, 명언이나 씨부려주는 웹페이지
## TODO
### Feature Card?
- [ ] 카드 형식으로 기능들을 표시한다.
- [ ] 적당한 위치에 Pin 기능
- [ ] 크기조절도? 이건 좀 과할지도...
### Tomoto 타이머 추가
- [x] 알람
    - [x] 알람소리 끄기 버튼
    - [ ] 알람 후 경과 시간 카운트(unmanaged time 관리)
- [x] 하루동안의 횟수 카운트
- [x] 웹페이지 새로고침시에도 해당 일자의 Focus 횟수는 store 에 저장하여 다시 진행 가능한 기능
- [ ] Setting
    - [x] 집중, 휴식시간을 설정 및 저장
    - [ ] 사진도 업로드?
    - [ ] 집중/휴식 따로 이미지 설정
- [ ] Lost Time
  - 타이머 종료후 1분이 지났어도 다음 타이머가 진행되지 않으면 발생
- [ ] 집중 이력
    - [ ] 횟수, 시작/종료시간 표로 표시
      - "Focus,시간,시간" string 형식으로 배열에 저장
    - [ ] 그래프로 시각화?
      - React Google Charts (Gantt Chart)
      > https://www.react-google-charts.com/examples/timeline
- [ ] 디자인
### 명언을 표시, 추가, 삭제? - 개인 DB를 갱신
- [x] 버튼으로 새로고침
- [x] 타이머로 새로고침
    - [ ] 새로고침 남은 시간 표시?
- [ ] AJAX 로 비동기통신 으로 DB에 저장된 명언 랜덤 조회, 표시
### 영단어, 잡지식 표시
- [ ] 영단어, 명언 등 표시
- [ ] 추가, 삭제, 전체 목록보기
***

### Run Node.js Server
> node server
### URL
> http://localhost:8080
### Debug
0. `server.js` 파일을 열고
1. VSCode `Run and Debug` 클릭
2. 환경 선택 `Node.js`
### sqlite3 설치
> npm install sqlite3
### CommonJS와 ES Module의 차이점
- CommonJS
	- Node.js 환경에서 주로 사용되는 모듈 시스템
	- require()로 모듈 가져옴
	- module.exports 로 내보냄
	- 동기적으로 작동
- ES Module
	- 최신 JS 표준, 브라우저 환경에서 사용되도록 설계
	- import, export 사용
	- 비동기적으로 작동

|   특징   |     CommonJS     |   ES Module    |
| :----: | :--------------: | :------------: |
|  로드방식  |       동기적        |      비동기적      |
| 트리 셰이킹 |       어려움        |       용이       |
|  사용환경  |      서버 사이드      |      브라우저      |
|  키워드   | require, exports | import, export |
### 명언 표시 참고 싸이트
https://inpa.tistory.com/entry/JS-%F0%9F%93%9A-Date-%EB%A9%94%EC%86%8C%EB%93%9C-%EC%A0%95%EB%A6%AC
## TypeScript
### 설치
> npm install --save-dev
### 프로젝트 초기화
> npx tsc --init
### tsconfig.json 파일에 추가
``` json
{
    "include": ["src"],
    "complierOptions": {
        "outDir": "./build"
    }
}
```
### 컴파일
> npx tsc
### 파일 변경사항 실시간 감지 및 컴파일
> npx tsc --watch
### Node.js 컴파일 : require 등이 컴파일 안될때
>npm i --save-dev @types/node
### es2017 컴파일 : String.padStart 컴파일 안될때
``` json
"lib": [
      "es2017",
      "dom",
      "scripthost",
    ],
```
