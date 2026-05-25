# Codex 설치 및 사용

이 저장소는 Codex에서 네 가지 방식으로 사용할 수 있습니다.

- 저장소 로컬 사용: 이 저장소에서 Codex를 실행하면 `.agents/skills/`, `AGENTS.md`, `.codex/agents/`가 바로 적용됩니다.
- skills CLI 설치: 다른 프로젝트 루트에서 `npx skills add ...`를 실행해 Codex 스킬만 프로젝트별로 설치합니다.
- Codex 프로젝트 팩 설치: 이 저장소의 installer로 스킬, hook, custom subagent를 대상 프로젝트에 함께 설치합니다.
- 플러그인 설치: `plugins/agent-skills` 번들을 Codex 플러그인으로 설치해 다른 프로젝트에서도 같은 스킬을 사용할 수 있습니다.

## 로컬 저장소에서 사용

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

스킬을 명시적으로 쓰고 싶으면 `$skill-name`으로 요청하거나, `using-agent-skills`를 읽어 어떤 스킬을 적용할지 정하게 하세요.

## skills CLI로 프로젝트별 설치

프로젝트마다 필요한 스킬만 켜고 끄려면 `skills` CLI가 가장 가볍습니다. 대상 프로젝트 루트에서 실행합니다.

```bash
npx skills add https://github.com/karais89/agent-skills --agent codex --skill '*'
```

Codex 대상 설치 경로는 다음과 같습니다.

| 범위 | 명령 옵션 | 설치 위치 | 용도 |
| --- | --- | --- | --- |
| 프로젝트 | 기본값 | `.agents/skills/` | 프로젝트별로 스킬을 커밋하거나 제거 |
| 전역 | `--global` | `~/.codex/skills/` | 모든 프로젝트에서 공통 사용 |

특정 스킬만 설치하려면 `--skill`을 하나 이상 지정합니다.

```bash
npx skills add https://github.com/karais89/agent-skills --agent codex --skill test-driven-development
```

프로젝트에 실제 파일로 복사하고 싶으면 `--copy`를 사용합니다. Windows나 팀 저장소처럼 symlink가 불편한 환경에 유용합니다.

```bash
npx skills add https://github.com/karais89/agent-skills --agent codex --skill '*' --copy -y
```

설치된 스킬을 확인하거나 제거할 때는 `skills` CLI의 관리 명령을 씁니다.

```bash
npx skills list --agent codex
npx skills remove --agent codex test-driven-development
```

주의: 이 방식은 `SKILL.md`와 해당 스킬 폴더의 보조 파일만 설치합니다. 이 저장소의 Codex SessionStart hook이나 `.codex/agents/` custom subagent는 설치하지 않습니다.

스킬만 설치할 때의 동작 차이는 다음과 같습니다.

| 항목 | 설치 여부 | 결과 |
| --- | --- | --- |
| `skills/*/SKILL.md` | 예 | Codex가 스킬 이름과 설명을 보고 필요한 본문을 읽을 수 있습니다. |
| 스킬 보조 파일 | 예 | 스킬 폴더 안의 `scripts/`, `references/` 같은 파일은 함께 설치됩니다. |
| SessionStart hook | 아니요 | 세션 시작 시 스킬 사용 안내를 자동 주입하지 않습니다. 필요한 경우 첫 요청에서 `$using-agent-skills`를 호출하거나 특정 스킬을 직접 지정하세요. |
| `.codex/agents/*` custom subagent | 아니요 | `code-reviewer`, `security-auditor`, `test-engineer`는 대상 프로젝트에 등록되지 않습니다. |
| `.codex/config.toml` | 아니요 | subagent 병렬 실행 설정 같은 Codex 프로젝트 설정은 변경되지 않습니다. |

이 제한은 보통 부작용이라기보다 범위 차이에 가깝습니다. `skills` CLI 설치는 프로젝트별로 스킬을 켜고 끄기 쉬운 대신, 자동 세션 컨텍스트와 specialist subagent 워크플로는 제공하지 않습니다. 그 둘까지 함께 원하면 아래 Codex 프로젝트 팩 설치를 사용합니다.

## Codex 프로젝트 팩으로 설치

스킬, SessionStart hook, custom subagent를 대상 프로젝트에 함께 설치하려면 이 저장소를 clone한 뒤 installer를 실행합니다.

```bash
git clone https://github.com/karais89/agent-skills.git
node agent-skills/scripts/install-codex-project.js --target /path/to/project
```

기본 `codex` 프로필은 다음 항목을 설치합니다.

| 항목 | 설치 위치 | 처리 방식 |
| --- | --- | --- |
| 스킬 | `.agents/skills/` | `skills/`의 각 스킬 디렉터리를 복사합니다. |
| hook runtime | `hooks/codex-session-start.js`, `hooks/session-start.sh` | 대상 프로젝트의 `hooks/` 아래 필요한 파일만 복사합니다. |
| hook config | `.codex/hooks.json` | 파일이 없으면 생성하고, 있으면 기존 `hooks.SessionStart` 배열에 agent-skills hook을 추가합니다. |
| custom subagent | `.codex/agents/*.toml` | `code-reviewer`, `security-auditor`, `test-engineer`를 복사합니다. |

설치 스크립트는 기존 unrelated 파일을 삭제하지 않습니다. 같은 managed 파일이 이미 있고 내용이 다르면 실패하며, 명시적으로 업데이트하려면 `--force`를 붙입니다.

```bash
node agent-skills/scripts/install-codex-project.js --target /path/to/project --force
```

`.codex/config.toml`은 프로젝트별 설정을 바꿀 수 있어 기본 설치에서 제외됩니다. subagent 병렬 실행 한도 같은 설정까지 복사하려면 `--config`를 붙입니다.

```bash
node agent-skills/scripts/install-codex-project.js --target /path/to/project --config
```

스킬만 복사하고 싶다면 `--profile skills`를 쓸 수 있지만, GitHub 원격 저장소에서 바로 설치하려는 경우에는 `skills` CLI가 더 간단합니다.

```bash
node agent-skills/scripts/install-codex-project.js --target /path/to/project --profile skills
```

## Codex 플러그인으로 설치

Marketplace 소스를 추가합니다.

```bash
codex plugin marketplace add karais89/agent-skills
```

그 다음 Codex에서:

1. `/plugins`를 엽니다.
2. `Agent Skills for Codex` marketplace를 선택합니다.
3. `agent-skills` 플러그인을 설치합니다.
4. `/hooks`를 열어 설치된 hook을 검토하고 신뢰 처리합니다.

플러그인에는 다음이 포함됩니다.

- `plugins/agent-skills/skills/`: 설치된 프로젝트에서 사용할 스킬
- `plugins/agent-skills/hooks/`: Codex SessionStart hook
- `plugins/agent-skills/.codex-plugin/plugin.json`: 플러그인 manifest

현재 플러그인 번들은 `.codex/agents/` custom subagent를 설치하지 않습니다. Subagent까지 대상 프로젝트에서 쓰려면 해당 프로젝트에 `.codex/agents/*.toml` 파일을 별도로 두어야 합니다.

## Custom subagent

이 저장소는 프로젝트 스코프 custom subagent를 제공합니다.

| 이름 | 용도 |
| --- | --- |
| `code-reviewer` | 코드 변경의 정확성, 회귀 위험, 유지보수성 리뷰 |
| `security-auditor` | 보안 경계, 입력 검증, secrets, 권한 모델 점검 |
| `test-engineer` | 테스트 전략과 누락된 회귀 테스트 확인 |

이 agent 파일들은 `skills` CLI 설치 대상이 아닙니다. 이 저장소 루트에서 Codex를 실행할 때는 `.codex/agents/*.toml`이 프로젝트 설정으로 발견되므로 별도의 hook 호출이 필요 없습니다. 반대로 다른 프로젝트에 `npx skills add ...`만 실행한 경우에는 `.codex/agents/`가 생기지 않으므로 아래 예시처럼 agent 이름을 지정해도 호출할 대상이 없습니다.

예시 요청:

```text
이 브랜치를 main 기준으로 리뷰해줘. code-reviewer, security-auditor, test-engineer를 병렬로 실행하고 결과를 blockers 중심으로 합쳐줘.
```

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
