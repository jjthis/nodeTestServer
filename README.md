## Chat Room Web

Firebase Firestore 기반의 **실시간 멀티룸 채팅 웹 애플리케이션**입니다.  
사용자는 닉네임을 설정한 뒤 채팅방을 생성하고, 방에 입장해 실시간으로 메시지를 주고받을 수 있습니다.

---

## 특징

- **실시간 멀티룸 채팅**
  - 채팅방 생성 / 입장 / 삭제
  - 방별로 메시지 실시간 동기화

- **별도 백엔드 서버 없이 구현**
  - React + Firebase Firestore만으로 데이터 저장 및 실시간 기능 구현

- **사용자 친화적인 채팅 UI**
  - 본인 / 상대 메시지 구분
  - 닉네임 기반 색상 아바타
  - “이전 메시지 더보기”로 과거 대화 점진 로딩

- **간편한 배포**
  - Netlify를 통한 정적 배포
  - 환경 변수로 Firebase 설정 분리

---

## 기술 스택

- **Frontend**
  - React 18
  - Create React App
  - CSS (커스텀 스타일)

- **Backend / Infra**
  - Firebase Firestore (NoSQL DB & 실시간 리스닝)
  - Firebase SDK (v9 compat)
  - Netlify (배포)

- **기타**
  - Jest, React Testing Library
  - LocalStorage (닉네임 저장)
  - 환경 변수 (`REACT_APP_*`)

---

## 주요 기능

- **닉네임 설정**
  - 첫 접속 시 채팅에 사용할 이름 입력
  - `localStorage`에 저장되어 새로고침/재방문 시 유지
  - 헤더 프로필 클릭으로 이름 변경 가능

- **채팅방 관리**
  - 채팅방 목록 조회 (Firestore `room` 컬렉션 실시간 구독)
  - 입력 필드에서 방 이름을 작성 후 전송하면 새로운 방 생성
  - 방 항목 클릭 시 해당 방 채팅 화면으로 이동
  - 방 항목 휠 클릭(중간 버튼) 시 방 삭제

- **실시간 채팅**
  - `room/{roomId}/chat` 서브컬렉션에 메시지 저장
  - `onSnapshot`을 사용해 실시간 변경 사항 반영
  - 본인/타인 메시지 레이아웃 및 색상 구분
  - 메시지 휠 클릭(중간 버튼) 시 개별 메시지 삭제

- **메시지 페이징 & 스크롤 UX**
  - 기본적으로 최신 20개 메시지만 조회
  - “이전 메시지 더보기” 버튼으로 10개씩 추가 로딩
  - 사용자가 하단을 보고 있을 때만 새 메시지 도착 시 자동 스크롤

---

## 폴더 구조 (요약)

```text
src/
  App.js          # 메인 컴포넌트(방 목록 + 채팅 화면)
  App.css         # 스타일
  index.js        # React 엔트리 포인트
  index.css       # 글로벌 스타일
  ...
public/
  index.html
  ...
```

---

## 환경 변수 설정

Firebase 설정 값은 코드에 직접 하드코딩하지 않고, CRA 규칙에 맞게 환경 변수로 관리합니다.

`.env` (또는 Netlify 환경 변수)에 아래와 같이 설정합니다.

```env
REACT_APP_apiKey=...
REACT_APP_authDomain=...
REACT_APP_projectId=...
REACT_APP_storageBucket=...
REACT_APP_messagingSenderId=...
REACT_APP_appId=...
REACT_APP_measurementId=...
```

> 실제 값은 본인 Firebase 프로젝트 설정에서 발급받아 입력합니다.

---

## 로컬 실행 방법

```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm start
```

- 기본 포트: `http://localhost:3000`
- 코드 변경 시 자동 리로드 됩니다.

---

## 빌드 및 배포

### 로컬 빌드

```bash
npm run build
```

- 최적화된 정적 파일이 `build/` 디렉터리에 생성됩니다.

### Netlify 배포

- **Build command**: `npm run build`  
- **Publish directory**: `build`  
- Netlify 대시보드에서 환경 변수(`REACT_APP_*`)를 등록한 뒤 배포하면 됩니다.

---

## 아키텍처 개요

- **데이터 모델**
  - `room` 컬렉션
    - 각 문서: 채팅방
  - `room/{roomId}/chat` 서브컬렉션
    - 각 문서: 메시지 (`text`, `sender`, `createdAt` 등)

- **실시간 흐름**
  - `onSnapshot`으로 `room` / `chat` 컬렉션을 구독
  - 문서 추가/삭제/변경 시 UI 자동 갱신
  - `firebase.firestore.FieldValue.serverTimestamp()`를 사용해 서버 기준 생성시간 저장

---

## 트러블슈팅 & 개선 포인트 (요약)

- **문제**: 새 메시지 도착 시 항상 맨 아래로 스크롤되어, 과거 메시지를 보는 중인 사용자가 방해됨  
  → **해결**: “거의 맨 아래에 있는 경우에만” 자동 스크롤을 수행하도록 조건 추가

- **문제**: Firestore 실시간 구독 중복 및 메모리 누수 가능성  
  → **해결**: `useEffect` cleanup에서 `onSnapshot` unsubscribe 호출, 의존성과 함께 관리

- **문제**: 메시지 수가 많아질수록 전체 로딩 비용 증가  
  → **해결**: `limitToLast(showCnt)` 기반의 단순 페이징 도입, “이전 메시지 더보기” 버튼으로 점진 로딩

---

## 라이선스

개인 포트폴리오 및 학습 목적의 프로젝트입니다.  
필요 시 자유롭게 참고하되, Firebase 설정 키 등 민감 정보는 각자 프로젝트에서 별도로 관리해야 합니다.

