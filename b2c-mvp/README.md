# 생각자국AI B2C MVP

이 디렉터리는 기존 시연 페이지와 분리된 B2C MVP 개발 공간입니다.

## UX 원칙
- 학생 화면은 `홈 / 생각스튜디오 / 내 성장 / MY` 4개 핵심 메뉴만 유지합니다.
- 교육과정 위치는 상단 breadcrumb로 항상 보이되, 상세 Curriculum Map은 필요할 때만 여는 drawer로 제공합니다.
- 생각스튜디오는 가로 화면에서 `학습 콘텐츠 | 소크라테스 대화` 2분할, 모바일에서 상하 구조를 사용합니다.
- 그래프·이미지·긴 지문·도형이 있으면 왼쪽 Content Stage를 사용합니다.
- 별도 콘텐츠가 없으면 소크라테스 캐릭터가 Content Stage에서 상태 애니메이션으로 학습을 동행합니다.
- AI 학습동행은 선택 기능이며 카메라·마이크는 별도 동의 후 사용합니다.

## 향후 모듈 경계
- student: 학생 홈, 생각스튜디오, 내 성장
- parent: 학부모 성장 요약 및 이용관리
- curriculum: 교육과정 버전, NCIC/교육부 변경 감지, 운영자 승인
- learning: Socratic, Thought Collision, Micro Teaching, Aha, 6단계 State Machine
- mastery: Concept/Reasoning/Independence/Transfer/Contradiction/Retention
- companion: 선택형 Camera/Mic, Intervention Engine, Avatar/Voice State
- admin: 시뮬레이션, 개선안, 회귀테스트, 광고, 후원, 운영

현재 페이지는 UX 골격을 확인하기 위한 1차 B2C 화면이며 실제 API와 AI 연결은 후속 단계에서 진행합니다.
