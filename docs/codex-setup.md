# Codex 설치 및 사용

이 저장소는 Codex에서 두 가지 방식으로 사용할 수 있습니다.

- 저장소 로컬 사용: 이 저장소에서 Codex를 실행하면 `.agents/skills/`, `AGENTS.md`, `.codex/agents/`가 바로 적용됩니다.
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

## Custom subagent

이 저장소는 프로젝트 스코프 custom subagent를 제공합니다.

| 이름 | 용도 |
| --- | --- |
| `code-reviewer` | 코드 변경의 정확성, 회귀 위험, 유지보수성 리뷰 |
| `security-auditor` | 보안 경계, 입력 검증, secrets, 권한 모델 점검 |
| `test-engineer` | 테스트 전략과 누락된 회귀 테스트 확인 |

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
bash hooks/session-start-test.sh
```

`validate-codex.js`는 플러그인 manifest, marketplace 메타데이터, custom agent, hook 설정, 스킬 미러, SessionStart hook 출력을 확인합니다.
