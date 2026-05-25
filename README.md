# Agent Skills for Codex

Codex가 소프트웨어 개발 작업을 더 안정적으로 수행하도록 돕는 엔지니어링 스킬 모음입니다. 각 스킬은 기획, 구현, 테스트, 리뷰, 출시까지의 반복 가능한 워크플로를 담고 있으며, Codex가 필요한 순간에 해당 지침만 점진적으로 읽도록 설계되어 있습니다.

## 빠른 설치

### Codex 플러그인으로 설치

이 저장소는 `plugins/agent-skills` 아래에 Codex 플러그인 번들을 포함합니다. Codex에서 marketplace 소스를 추가한 뒤 플러그인 브라우저에서 설치합니다.

```bash
codex plugin marketplace add karais89/agent-skills
```

그 다음 Codex 안에서 `/plugins`를 열고 `Agent Skills for Codex` marketplace를 선택한 뒤 `agent-skills`를 설치하세요.

설치 후 `/hooks`에서 플러그인 hook을 검토하고 신뢰 처리해야 Codex가 세션 시작 컨텍스트를 자동으로 불러옵니다.

### 로컬 개발용으로 사용

이 저장소 자체에서 작업할 때는 별도 설치 없이 루트에서 Codex를 실행하면 됩니다.

```bash
git clone https://github.com/karais89/agent-skills.git
cd agent-skills
codex
```

Codex는 `AGENTS.md`를 프로젝트 지침으로 읽고, `.agents/skills/`에서 저장소 스코프 스킬을 발견하며, `.codex/agents/`의 프로젝트 subagent를 사용할 수 있습니다.

자세한 설치 흐름은 [docs/codex-setup.md](docs/codex-setup.md)를 참고하세요.

## 사용 방식

Codex는 스킬 이름과 설명만 먼저 알고 있다가, 작업이 스킬 설명과 맞을 때 해당 `SKILL.md` 본문을 읽습니다. 명시적으로 호출하려면 `$skill-name` 형태로 요청하거나 `using-agent-skills`를 읽게 하면 됩니다.

예시:

```text
$test-driven-development 방식으로 이 버그를 고쳐줘.
```

```text
이 브랜치를 리뷰해줘. code-reviewer, security-auditor, test-engineer를 병렬로 사용해서 blockers를 합쳐줘.
```

## 포함된 스킬

총 23개 스킬이 포함되어 있습니다. 22개는 개발 생명주기별 워크플로이고, 1개는 어떤 스킬을 쓸지 결정하는 메타 스킬입니다.

| 단계 | 스킬 |
| --- | --- |
| Meta | `using-agent-skills` |
| Define | `interview-me`, `idea-refine`, `spec-driven-development` |
| Plan | `planning-and-task-breakdown` |
| Build | `incremental-implementation`, `test-driven-development`, `context-engineering`, `source-driven-development`, `doubt-driven-development`, `frontend-ui-engineering`, `api-and-interface-design` |
| Verify | `browser-testing-with-devtools`, `debugging-and-error-recovery` |
| Review | `code-review-and-quality`, `code-simplification`, `security-and-hardening`, `performance-optimization` |
| Ship | `git-workflow-and-versioning`, `ci-cd-and-automation`, `deprecation-and-migration`, `documentation-and-adrs`, `shipping-and-launch` |

## Codex subagent

프로젝트 스코프 subagent는 `.codex/agents/`에 있습니다.

| 이름 | 역할 |
| --- | --- |
| `code-reviewer` | 정확성, 유지보수성, 아키텍처, 보안, 성능 관점의 읽기 전용 코드 리뷰 |
| `security-auditor` | 위협 모델링, 입력 검증, secrets, 권한 경계 중심 보안 점검 |
| `test-engineer` | 테스트 전략, 누락된 케이스, 회귀 방지 관점의 검증 |

## 프로젝트 구조

```text
agent-skills/
├── AGENTS.md                         # Codex 프로젝트 지침
├── skills/                           # 스킬 원본
├── .agents/
│   ├── skills/                       # Codex 저장소 스코프 스킬 미러
│   └── plugins/marketplace.json      # 로컬 Codex marketplace 등록 정보
├── .codex/
│   ├── agents/                       # Codex 프로젝트 subagent
│   ├── config.toml                   # Codex 프로젝트 설정
│   └── hooks.json                    # Codex 프로젝트 hook
├── plugins/agent-skills/             # 설치 가능한 Codex 플러그인 번들
├── hooks/                            # Codex SessionStart hook
├── references/                       # 스킬이 필요할 때 참조하는 체크리스트
├── scripts/                          # 스킬 동기화 및 검증 스크립트
└── docs/                             # Codex 설치 및 스킬 작성 문서
```

## 유지보수

스킬 본문은 `skills/`를 원본으로 수정합니다. 수정 후 Codex가 읽는 미러와 플러그인 번들을 동기화하세요.

```bash
node scripts/sync-codex-skills.js
```

배포 전 검증:

```bash
node scripts/validate-skills.js
node scripts/validate-codex.js
bash hooks/session-start-test.sh
```

## 라이선스

MIT
