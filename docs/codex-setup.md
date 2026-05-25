# Codex 설치 및 사용

이 저장소의 권장 설치 방법은 두 가지입니다.

- 스킬만 설치: `skills` CLI가 스킬 선택과 대상 agent 선택을 맡습니다.
- Codex 프로젝트 팩 설치: 이 저장소의 installer가 스킬, hook, custom subagent를 대상 프로젝트에 함께 설치합니다.

## 1. 스킬만 설치

대상 프로젝트 루트에서 실행합니다.

```bash
npx skills@latest add karais89/agent-skills
```

설치 중 원하는 스킬과 대상 agent를 고릅니다. 전체 설치를 원하면 picker에서 전체 선택을 고르면 됩니다.

이 방식은 다음만 설치합니다.

| 항목 | 설치 여부 | 결과 |
| --- | --- | --- |
| `SKILL.md`와 스킬 보조 파일 | 예 | Codex가 선택한 스킬을 발견하고 사용할 수 있습니다. |
| SessionStart hook | 아니요 | 세션 시작 시 `using-agent-skills` 안내를 자동 주입하지 않습니다. |
| `.codex/agents/*` custom subagent | 아니요 | `code-reviewer`, `security-auditor`, `test-engineer`는 등록되지 않습니다. |
| `.codex/config.toml` | 아니요 | 프로젝트별 Codex 설정은 변경되지 않습니다. |

스킬만 프로젝트별로 켜고 끄고 싶다면 이 방식이 가장 간단합니다.

## 2. Codex 프로젝트 팩 설치

스킬, SessionStart hook, custom subagent를 함께 설치하려면 대상 프로젝트 루트에서 실행합니다.

```bash
npx github:karais89/agent-skills
```

기본 `codex` 프로필은 다음 항목을 설치합니다.

| 항목 | 설치 위치 | 처리 방식 |
| --- | --- | --- |
| 스킬 | `.agents/skills/` | `skills/`의 각 스킬 디렉터리를 복사합니다. |
| hook runtime | `hooks/codex-session-start.js`, `hooks/session-start.sh` | 대상 프로젝트의 `hooks/` 아래 필요한 파일만 복사합니다. |
| hook config | `.codex/hooks.json` | 파일이 없으면 생성하고, 있으면 기존 `hooks.SessionStart` 배열에 agent-skills hook을 추가합니다. |
| custom subagent | `.codex/agents/*.toml` | `code-reviewer`, `security-auditor`, `test-engineer`를 복사합니다. |

기존 managed 파일이 이미 있고 내용이 다르면 설치는 실패합니다. 의도적으로 업데이트하려면 `--force`를 붙입니다.

```bash
npx github:karais89/agent-skills --force
```

`.codex/config.toml`은 프로젝트별 설정을 바꿀 수 있어 기본 설치에서 제외됩니다. subagent 병렬 실행 한도 같은 설정까지 복사하려면 `--config`를 붙입니다.

```bash
npx github:karais89/agent-skills --config
```

설치 계획만 보고 싶다면 `--dry-run`을 사용합니다.

```bash
npx github:karais89/agent-skills --dry-run
```

## Custom subagent

Codex 프로젝트 팩은 프로젝트 스코프 custom subagent를 제공합니다.

| 이름 | 용도 |
| --- | --- |
| `code-reviewer` | 코드 변경의 정확성, 회귀 위험, 유지보수성 리뷰 |
| `security-auditor` | 보안 경계, 입력 검증, secrets, 권한 모델 점검 |
| `test-engineer` | 테스트 전략과 누락된 회귀 테스트 확인 |

이 agent들은 자동으로 작업을 가로채지 않습니다. Codex가 프로젝트 루트의 `.codex/agents/*.toml`을 발견하면 사용할 수 있는 specialist로 노출되고, 사용자가 이름을 지정하거나 병렬 리뷰를 요청할 때 호출하는 구조입니다.

예시 요청:

```text
이 브랜치를 main 기준으로 리뷰해줘. code-reviewer, security-auditor, test-engineer를 병렬로 실행하고 결과를 blockers 중심으로 합쳐줘.
```

## 로컬 저장소에서 작업

이 저장소 자체에서 작업할 때는 별도 설치 없이 루트에서 Codex를 실행하면 됩니다.

```bash
git clone https://github.com/karais89/agent-skills.git
cd agent-skills
codex
```

Codex는 다음 항목을 자동으로 사용합니다.

- `AGENTS.md`: 프로젝트 지침
- `.agents/skills/`: 저장소 스코프 스킬
- `.codex/agents/`: 프로젝트 스코프 custom subagent
- `.codex/hooks.json`: 프로젝트 hook

## Codex 플러그인 참고

이 저장소에는 `plugins/agent-skills` Codex 플러그인 번들이 남아 있습니다. 다만 현재 플러그인 번들은 custom subagent를 설치하지 않으므로 권장 설치 경로에서는 제외합니다. Subagent까지 대상 프로젝트에서 쓰려면 Codex 프로젝트 팩 installer를 사용하세요.

## 스킬 수정과 동기화

스킬 원본은 `skills/`입니다. 수정 후 Codex 미러와 플러그인 번들을 동기화합니다.

```bash
node scripts/sync-codex-skills.js
```

동기화 상태만 확인하려면:

```bash
node scripts/sync-codex-skills.js --check
```

## 검증

배포 전 다음 명령을 실행합니다.

```bash
node scripts/validate-skills.js
node scripts/validate-codex.js
node scripts/install-codex-project-test.js
bash hooks/session-start-test.sh
```

`validate-codex.js`는 플러그인 manifest, marketplace 메타데이터, custom agent, hook 설정, 스킬 미러, SessionStart hook 출력을 확인합니다.
