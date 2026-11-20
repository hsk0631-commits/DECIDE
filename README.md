# DECIDE - 의사결정 도우미

선택하기 어려운 순간을 위한 한국어 개인용 의사결정 도우미입니다.
고민을 정리하고, 중요한 평가 기준과 필수 조건을 바탕으로 선택지를 가중 평가해 더 납득할 수 있는 선택을 돕습니다.
정답을 알려주는 도구가 아니라, 결정의 근거를 스스로 세우도록 돕는 도구입니다.

## 주요 기능

- **고민 등록**: 제목과 카테고리만 입력하면 바로 시작하거나, 7개 카테고리(일상생활, 소비 및 쇼핑, 자동차 및 이동수단, 진로 및 직장, 여행 및 여가, 인간관계 및 공동 결정, 직접 설정) 템플릿으로 평가 기준·필수 조건·선택지를 미리 구성할 수 있습니다.
- **가중 평가**: 선택지별로 평가 기준 점수(1~5점)를 입력하고, 기준마다 중요도(가중치 1~5)를 조정합니다. 미평가 항목은 빈 칸으로 남길 수 있습니다.
- **필수 조건 필터링**: 조건이 미충족인 선택지는 추천에서 제외되고, 미확인 조건은 경고로 표시됩니다.
- **실시간 추천**: 입력이 바뀔 때마다 가중 점수를 다시 계산해 `추천`, `조건부 추천`(1·2위 차이 5% 이내), `데이터 부족`(평가율 50% 미만), `추천 불가` 중 하나로 결과를 제시합니다.
- **결정 회고**: 실제 선택한 옵션, 만족도(1~5점), 자유 서술 회고를 기록하고 `결정 완료`로 전환합니다.
- **공유 및 내보내기**: 결정 내용과 회고를 텍스트(.txt), 마크다운(.md), JSON(.json)으로 미리보기하고 클립보드 복사 또는 파일 다운로드할 수 있습니다.
- **통계 대시보드**: 완료 건수, 평균 만족도, 추천 일치율(실제 선택 = 추천 비율), 만족도 분포, 카테고리별 통계, 최근 6개월 완료 추이를 확인합니다.

모든 데이터는 브라우저 `localStorage`(키: `decide_projects_v1`)에만 저장되며 서버로 전송되지 않습니다.

## 기술 스택

- [Next.js](https://nextjs.org) 16 (App Router, Turbopack)
- [React](https://react.dev) 19
- TypeScript (strict)
- [Tailwind CSS](https://tailwindcss.com) v4 (`@tailwindcss/turbopack`)
- ESLint 9 + `eslint-config-next`

## 실행 방법

```bash
npm install
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인할 수 있습니다.

```bash
npm run build   # 프로덕션 빌드
npm run start   # 빌드 결과 실행
npm run lint    # 린트 검사
```

## 프로젝트 구조

```
app/
  layout.tsx              루트 레이아웃 (폰트, 전역 스타일)
  globals.css             Tailwind 진입 CSS
  page.tsx                홈: 고민 생성, 요약 카드, 고민 목록
  detail/[id]/page.tsx    점수·가중치·필수 조건 편집, 실시간 추천
  review/[id]/page.tsx    결정 회고 작성 및 조회
  share/[id]/page.tsx     텍스트/마크다운/JSON 내보내기
  stats/page.tsx          통계 대시보드 (개요/분야별/추이)
constants/
  templates.ts            카테고리별 기본 기준·조건·선택지 템플릿
types/
  decision.ts             프로젝트·선택지·기준·조건·결과·회고 타입
utils/
  storage.ts              localStorage 기반 저장/조회/삭제
  algorithm.ts            필수 조건 필터링과 가중 점수 추천 로직
```

`@/*` 경로 별칭이 프로젝트 루트를 가리키므로 `@/types/decision` 처럼 임포트합니다.
