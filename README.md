# Agent Skills for Codex

[![skills.sh](https://skills.sh/b/karais89/agent-skills)](https://skills.sh/karais89/agent-skills)

Codex가 소프트웨어 개발 작업을 더 안정적으로 수행하도록 돕는 엔지니어링 스킬 모음입니다. 각 스킬은 기획, 구현, 테스트, 리뷰, 출시까지의 반복 가능한 워크플로를 담고 있으며, Codex가 필요한 순간에 해당 지침만 점진적으로 읽도록 설계되어 있습니다.

## 설치

### 1. 스킬만 설치

대부분의 프로젝트에서는 `skills` CLI로 시작하면 됩니다. 설치 중 원하는 스킬과 대상 agent를 고를 수 있고, 전체 설치를 원하면 picker에서 전체 선택을 고르면 됩니다.

```bash
npx skills@latest add karais89/agent-skills
```

이 방식은 스킬 파일과 스킬 보조 파일만 설치합니다. Codex SessionStart hook, `.codex/agents/` custom subagent, `.codex/config.toml`은 설치하지 않습니다.

### 2. Codex 프로젝트 팩 설치

스킬, SessionStart hook, custom subagent를 현재 프로젝트에 함께 넣고 싶다면 프로젝트 루트에서 실행합니다.

```bash
npx github:karais89/agent-skills
```

기본 설치 항목:

| 항목 | 설치 위치 |
| --- | --- |
| 스킬 | `.agents/skills/` |
| SessionStart hook runtime | `hooks/codex-session-start.js`, `hooks/session-start.sh` |
| SessionStart hook config | `.codex/hooks.json` |
| custom subagent | `.codex/agents/*.toml` |

기존 managed 파일이 다르면 기본적으로 덮어쓰지 않습니다. 업데이트하려면 `--force`를 붙입니다. `.codex/config.toml`은 기본 설치에서 제외되며, 필요할 때만 `--config`로 opt-in합니다.

```bash
npx github:karais89/agent-skills --force
npx github:karais89/agent-skills --config
```

자세한 설치 흐름은 [docs/codex-setup.md](docs/codex-setup.md)를 참고하세요.

## 사용

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

Codex 프로젝트 팩은 다음 프로젝트 스코프 subagent를 설치합니다.

| 이름 | 역할 |
| --- | --- |
| `code-reviewer` | 정확성, 유지보수성, 아키텍처, 보안, 성능 관점의 읽기 전용 코드 리뷰 |
| `security-auditor` | 위협 모델링, 입력 검증, secrets, 권한 경계 중심 보안 점검 |
| `test-engineer` | 테스트 전략, 누락된 케이스, 회귀 방지 관점의 검증 |

이 agent들은 스킬처럼 자동으로 작업을 가로채지 않습니다. 사용자가 agent 이름을 지정하거나 병렬 리뷰를 요청할 때 호출하는 구조입니다.

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
