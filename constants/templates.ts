import { DecisionCategory, DecisionCriterion, DecisionRequirement } from '../types/decision';

export interface DecisionTemplate {
  category: DecisionCategory;
  name: string;
  description: string;
  defaultCriteria: Omit<DecisionCriterion, 'id'>[];
  defaultRequirements: Omit<DecisionRequirement, 'id' | 'status'>[];
  defaultOptionsPlaceholder: string[];
}

export const DECISION_TEMPLATES: Record<DecisionCategory, DecisionTemplate> = {
  daily: {
    category: 'daily',
    name: '일상생활',
    description: '오늘 무엇을 할지, 어떤 결정을 내릴지 가볍게 고민할 때 사용합니다.',
    defaultCriteria: [
      { title: '만족도', weight: 5, description: '얼마나 즐겁고 만족스러운가' },
      { title: '소요 시간', weight: 3, description: '시간이 얼마나 소요되는가' },
      { title: '비용', weight: 3, description: '비용이 합리적인가' }
    ],
    defaultRequirements: [
      { title: '예산 범위 내인가?' },
      { title: '오늘 안에 처리할 수 있는가?' }
    ],
    defaultOptionsPlaceholder: ['선택지 A', '선택지 B']
  },
  shopping: {
    category: 'shopping',
    name: '소비 및 쇼핑',
    description: '물건을 구매할 때 가치와 비용을 꼼꼼히 비교합니다.',
    defaultCriteria: [
      { title: '가성비/가격', weight: 5, description: '가격 대비 성능과 효용' },
      { title: '필수성/실용성', weight: 5, description: '실제로 얼마나 자주 사용하는가' },
      { title: '내구성/품질', weight: 4, description: '오래 사용할 수 있는가' },
      { title: '디자인/만족감', weight: 3, description: '취향에 부합하는가' }
    ],
    defaultRequirements: [
      { title: '당장 결제 가능한 예산이 있는가?' },
      { title: '보관할 공간이 충분한가?' }
    ],
    defaultOptionsPlaceholder: ['제품 A (구매)', '제품 B (구매)', '사지 않기 (보류)']
  },
  car: {
    category: 'car',
    name: '자동차 및 이동수단',
    description: '차량 구매, 교체, 유지보수 또는 이동 수단을 결정합니다.',
    defaultCriteria: [
      { title: '유지비 (연비/보험료/세금)', weight: 5, description: '고정 지출 부담' },
      { title: '안정성 및 안전', weight: 5, description: '사고 예방 및 튼튼함' },
      { title: '용도 적합성 (출퇴근/패밀리)', weight: 4, description: '주행 목적에 알맞은가' },
      { title: '감가상각 및 잔존가치', weight: 3, description: '향후 판매 시 유리한가' }
    ],
    defaultRequirements: [
      { title: '월 할부금 및 유지비를 감당할 수 있는가?' },
      { title: '주차 공간 및 충전/주유 인프라가 확보되었는가?' }
    ],
    defaultOptionsPlaceholder: ['새차 구입', '중고차 구입', '현재 차량 유지', '대중교통 이용']
  },
  career: {
    category: 'career',
    name: '진로 및 직장',
    description: '이직, 진학, 커리어 방향성 등 중요한 인생의 결정을 내립니다.',
    defaultCriteria: [
      { title: '성장 가능성 및 커리어 비전', weight: 5, description: '장기적인 발전이 가능한가' },
      { title: '보상 및 복리후생', weight: 5, description: '연봉 및 복지 조건' },
      { title: '근무 환경 및 워라밸', weight: 4, description: '업무 강도와 개인 시간' },
      { title: '조직 문화 및 동료', weight: 4, description: '함께 일하는 사람들' }
    ],
    defaultRequirements: [
      { title: '최소 목표 연봉 조건을 충족하는가?' },
      { title: '출퇴근 시간이 감내할 수 있는 범위인가?' }
    ],
    defaultOptionsPlaceholder: ['현직장 유지', '이직 (A 회사)', '이직 (B 회사)']
  },
  travel: {
    category: 'travel',
    name: '여행 및 여가',
    description: '여행지 선정, 휴가 일정, 여가 활동을 계획합니다.',
    defaultCriteria: [
      { title: '힐링 및 재미', weight: 5, description: '얼마나 즐겁고 재충전이 되는가' },
      { title: '예산 적정성', weight: 4, description: '여행 경비가 예산 내인가' },
      { title: '이동 피로도', weight: 3, description: '일정이 너무 빡빡하지 않은가' },
      { title: '시즌 적합성 (날씨/성수기)', weight: 3, description: '시기상 방문하기 좋은가' }
    ],
    defaultRequirements: [
      { title: '원하는 휴가 일정을 확보할 수 있는가?' },
      { title: '예산 총액이 준비되어 있는가?' }
    ],
    defaultOptionsPlaceholder: ['국내 여행 (부산)', '해외 여행 (일본)', '호캉스 (휴식)']
  },
  relationship: {
    category: 'relationship',
    name: '인간관계 및 공동 결정',
    description: '모임, 파트너와의 결정, 공동 프로젝트 등을 조율합니다.',
    defaultCriteria: [
      { title: '상호 합의 및 만족도', weight: 5, description: '참여자 모두가 수용 가능한가' },
      { title: '관계 유지 및 신뢰', weight: 5, description: '장기적 신뢰에 도움이 되는가' },
      { title: '공조 및 역할 분담', weight: 4, description: '책임과 역할이 공정한가' }
    ],
    defaultRequirements: [
      { title: '상대방의 필수 동의를 얻었는가?' },
      { title: '법적/도덕적 문제가 없는가?' }
    ],
    defaultOptionsPlaceholder: ['안건 수용', '조건부 수정 수용', '정중한 거절']
  },
  custom: {
    category: 'custom',
    name: '직접 설정',
    description: '템플릿 없이 자유롭게 기준과 조건을 설정하여 결정합니다.',
    defaultCriteria: [
      { title: '중요 기준 1', weight: 5, description: '가장 중요하게 생각하는 기준' },
      { title: '중요 기준 2', weight: 4, description: '두 번째로 중요한 기준' },
      { title: '중요 기준 3', weight: 3, description: '세 번째로 중요한 기준' }
    ],
    defaultRequirements: [
      { title: '핵심 제약사항을 만족하는가?' }
    ],
    defaultOptionsPlaceholder: ['선택지 1', '선택지 2']
  }
};
