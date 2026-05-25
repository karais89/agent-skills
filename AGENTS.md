# AGENTS.md

이 파일은 이 저장소에서 작업하는 Codex 에이전트를 위한 지속 지침입니다.

## 저장소 개요

이 저장소는 Codex용 생산급 엔지니어링 스킬 모음입니다. 스킬은 AI 코딩 에이전트가 기획, 구현, 테스트, 리뷰, 출시 과정을 일관되게 따르도록 돕는 재사용 가능한 워크플로입니다.

## Codex 구조

- `AGENTS.md`: Codex가 프로젝트 루트에서 읽는 지속 지침입니다.
- `skills/<skill-name>/SKILL.md`: 스킬 원본입니다.
- `.agents/skills/<skill-name>/SKILL.md`: Codex 저장소 스코프 스킬 미러입니다. Codex는 현재 작업 디렉터리에서 Git 루트까지 `.agents/skills`를 스캔합니다.
- `.codex/agents/*.toml`: Codex 프로젝트 스코프 custom subagent입니다.
- `.codex/hooks.json`: Codex 프로젝트 lifecycle hook 설정입니다.
- `plugins/agent-skills/.codex-plugin/plugin.json`: 설치 가능한 Codex 플러그인 manifest입니다.
- `.agents/plugins/marketplace.json`: 이 저장소를 Codex plugin marketplace로 노출하는 로컬 marketplace 정보입니다.

## 작업 규칙

- 작업을 시작할 때 어떤 스킬이 적용되는지 판단하려면 먼저 `using-agent-skills`를 사용합니다.
- 사용자가 스킬을 명시하면 해당 스킬을 반드시 읽고 따릅니다.
- 사용자 요청이 스킬 설명과 명확히 맞으면 암시적으로 해당 스킬을 사용합니다.
- 여러 스킬이 적용되면 필요한 최소 조합만 사용하고, 적용 순서를 간단히 알립니다.
- 프로젝트 subagent는 사용자가 병렬 리뷰, specialist validation, 명시적인 subagent workflow를 요청할 때 사용합니다.
- 리뷰 및 감사 성격의 subagent는 읽기 전용이어야 합니다.

## Codex 유지보수 규칙

- 스킬 내용은 항상 `skills/` 원본을 먼저 수정합니다.
- `skills/`를 바꾼 뒤 `node scripts/sync-codex-skills.js`를 실행해 `.agents/skills/`와 `plugins/agent-skills/skills/`를 갱신합니다.
- 배포 전 `node scripts/validate-skills.js`와 `node scripts/validate-codex.js`를 실행합니다.
- Codex hook 출력은 `hookSpecificOutput.additionalContext` 형식을 사용합니다.
- custom agent는 좁은 역할을 유지합니다. 리뷰/감사 에이전트는 목적상 수정이 필요하다고 명시되어 있지 않으면 읽기 전용으로 둡니다.

## 스킬 작성 규칙

### 디렉터리 구조

```text
skills/
  {skill-name}/
    SKILL.md
    scripts/
      {script-name}.sh
```

- 스킬 디렉터리는 kebab-case를 사용합니다.
- 스킬 본문 파일명은 항상 `SKILL.md`입니다.
- helper script가 필요할 때만 `scripts/`를 둡니다.
- 스크립트는 가능하면 Bash로 작성하고, status 메시지는 stderr에, 기계가 읽을 출력은 stdout에 씁니다.

### SKILL.md 형식

```markdown
---
name: {skill-name}
description: {무엇을 하는 스킬인지 한 문장으로 설명하고, "Use when" 트리거 조건을 포함합니다.}
---

# {Skill Title}

{스킬의 목적과 가치}

## Overview

{무엇을 하는지}

## When to Use

{언제 쓰는지}

## Common Rationalizations

{에이전트가 절차를 건너뛰려 할 때의 흔한 핑계와 반박}

## Red Flags

{문제가 생겼다는 신호}

## Verification

{완료 증거}
```

필요하면 `Workflow`, `Process`, `How It Works` 같은 추가 섹션을 둘 수 있습니다. 단, 검증 스크립트가 요구하는 핵심 섹션은 유지합니다.

## 컨텍스트 효율

- `SKILL.md`는 500줄 이하를 목표로 합니다.
- 상세 reference는 별도 파일로 분리하고, `SKILL.md`에서 직접 링크합니다.
- 긴 코드 예시는 스크립트나 reference 파일로 옮깁니다.
- Codex가 스킬 설명만 먼저 보고 필요할 때 본문을 읽는다는 점을 전제로 작성합니다.

## 검증 명령

```bash
node scripts/sync-codex-skills.js --check
node scripts/validate-skills.js
node scripts/validate-codex.js
node scripts/install-codex-project-test.js
bash hooks/session-start-test.sh
```

## Codex 설치 요약

스킬만 설치하려면 대상 프로젝트 루트에서:

```bash
npx skills@latest add karais89/agent-skills
```

이 방식은 스킬 파일만 설치하며 Codex SessionStart hook, `.codex/agents/` custom subagent, `.codex/config.toml`은 설치하지 않습니다.

대상 프로젝트에 스킬, SessionStart hook, custom subagent를 함께 설치하려면 대상 프로젝트 루트에서:

```bash
npx github:karais89/agent-skills
```

현재 Codex 플러그인 번들은 custom subagent를 설치하지 않으므로 권장 설치 경로에서는 제외합니다.
