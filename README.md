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

4. CSS 파일에 Tailwind 지시어 추가 (index.css)
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

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
