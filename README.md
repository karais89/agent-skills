# Agent Skills for Codex

[![skills.sh](https://skills.sh/b/karais89/agent-skills)](https://skills.sh/karais89/agent-skills)

Codex가 소프트웨어 개발 작업을 더 안정적으로 수행하도록 돕는 엔지니어링 스킬 모음입니다. 각 스킬은 기획, 구현, 테스트, 리뷰, 출시까지의 반복 가능한 워크플로를 담고 있으며, Codex가 필요한 순간에 해당 지침만 점진적으로 읽도록 설계되어 있습니다.

## 빠른 설치

### skills CLI로 프로젝트별 설치

프로젝트마다 스킬을 켜고 끄고 싶다면 Codex 플러그인보다 `skills` CLI 설치가 더 단순합니다. 대상 프로젝트 루트에서 실행하면 Codex용 스킬이 그 프로젝트의 `.agents/skills/`에 설치됩니다.

```bash
npx skills add https://github.com/karais89/agent-skills --agent codex --skill '*'
```

특정 스킬만 설치할 수도 있습니다.

```bash
npx skills add https://github.com/karais89/agent-skills --agent codex --skill test-driven-development
```

프로젝트에 파일로 커밋 가능한 복사본을 두고 싶거나 symlink가 불편한 환경에서는 `--copy`를 붙이세요.

```bash
npx skills add https://github.com/karais89/agent-skills --agent codex --skill '*' --copy -y
```

전역 설치가 필요할 때만 `--global`을 사용합니다.

```bash
npx skills add https://github.com/karais89/agent-skills --agent codex --skill '*' --global
```

이 방식은 스킬만 설치합니다. Codex SessionStart hook까지 함께 쓰려면 아래 플러그인 또는 Codex 프로젝트 팩 설치를 사용하세요. Custom subagent는 현재 이 저장소의 `.codex/agents/`에만 있는 프로젝트 스코프 설정입니다.

스킬만 설치할 때의 차이는 명확합니다.

| 항목 | skills CLI 설치 | 영향 |
| --- | --- | --- |
| `skills/*/SKILL.md` | 설치됨 | Codex가 작업에 맞는 스킬을 발견하고 읽을 수 있습니다. |
| 스킬 보조 파일 | 설치됨 | `idea-refine` 같은 스킬의 `scripts/`, reference 파일이 함께 따라갑니다. |
| SessionStart hook | 설치 안 됨 | 새 세션 시작 시 `using-agent-skills` 안내를 자동 주입하지 않습니다. 필요하면 직접 `$using-agent-skills` 또는 관련 스킬을 호출하세요. |
| `.codex/agents/*` custom subagent | 설치 안 됨 | `code-reviewer`, `security-auditor`, `test-engineer` 같은 병렬 specialist agent는 대상 프로젝트에 생기지 않습니다. |
| `.codex/config.toml` | 설치 안 됨 | subagent 병렬 실행 한도 같은 Codex 프로젝트 설정은 바뀌지 않습니다. |

따라서 프로젝트별로 스킬만 가볍게 켜고 끄려면 `skills` CLI가 적합하고, SessionStart hook까지 포함하려면 플러그인이나 아래 Codex 프로젝트 팩 설치가 더 맞습니다. `code-reviewer`, `security-auditor`, `test-engineer` 같은 custom subagent까지 대상 프로젝트에 넣고 싶다면 Codex 프로젝트 팩 installer를 사용하세요.

### Codex 프로젝트 팩으로 설치

스킬, SessionStart hook, custom subagent를 대상 프로젝트에 한 번에 넣고 싶다면 이 저장소를 clone한 뒤 installer를 실행합니다. Bash 대신 Node 스크립트로 제공해 Windows에서도 같은 방식으로 동작합니다.

```bash
git clone https://github.com/karais89/agent-skills.git
node agent-skills/scripts/install-codex-project.js --target /path/to/project
```

이 기본 `codex` 프로필은 다음을 설치합니다.

| 항목 | 설치 위치 | 처리 방식 |
| --- | --- | --- |
| 스킬 | `.agents/skills/` | 이 저장소의 `skills/`를 스킬별로 복사합니다. |
| hook runtime | `hooks/codex-session-start.js`, `hooks/session-start.sh` | 대상 프로젝트의 기존 `hooks/` 파일은 건드리지 않고 필요한 파일만 복사합니다. |
| hook config | `.codex/hooks.json` | 파일이 없으면 생성하고, 있으면 기존 `SessionStart` hook에 agent-skills hook을 병합합니다. |
| custom subagent | `.codex/agents/*.toml` | `code-reviewer`, `security-auditor`, `test-engineer`를 복사합니다. |

기존 managed 파일이 다르면 기본적으로 덮어쓰지 않습니다. 업데이트하려면 `--force`를 붙입니다. `.codex/config.toml`은 프로젝트 설정을 침범할 수 있어 기본 설치에서 제외하며, 필요할 때만 `--config`를 붙입니다.

```bash
node agent-skills/scripts/install-codex-project.js --target /path/to/project --force
node agent-skills/scripts/install-codex-project.js --target /path/to/project --config
```

### Codex 플러그인으로 설치

이 저장소는 `plugins/agent-skills` 아래에 Codex 플러그인 번들을 포함합니다. Codex에서 marketplace 소스를 추가한 뒤 플러그인 브라우저에서 설치합니다.

```bash
codex plugin marketplace add karais89/agent-skills
```

그 다음 Codex 안에서 `/plugins`를 열고 `Agent Skills for Codex` marketplace를 선택한 뒤 `agent-skills`를 설치하세요.

설치 후 `/hooks`에서 플러그인 hook을 검토하고 신뢰 처리해야 Codex가 세션 시작 컨텍스트를 자동으로 불러옵니다.

현재 플러그인 번들은 custom subagent를 설치하지 않습니다. Subagent는 이 저장소의 `.codex/agents/`에 있는 프로젝트 스코프 설정입니다.

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

이 agent들은 스킬처럼 자동으로 작업을 가로채지 않습니다. Codex가 프로젝트 루트의 `.codex/agents/*.toml`을 발견하면 사용할 수 있는 specialist로 노출되고, 사용자가 `code-reviewer`, `security-auditor`, `test-engineer`처럼 이름을 지정하거나 병렬 리뷰를 요청할 때 호출하는 구조입니다. `npx skills add ...`로 스킬만 설치한 다른 프로젝트에는 이 파일들이 복사되지 않으므로, agent 이름을 불러도 사용할 수 없습니다.

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
node scripts/install-codex-project-test.js
bash hooks/session-start-test.sh
```

## 라이선스

MIT
