# Contributing

이 저장소는 Codex용 엔지니어링 스킬 모음입니다. 기여할 때는 Codex의 점진적 스킬 로딩과 플러그인 배포 구조를 기준으로 판단합니다.

## 새 스킬 추가

1. `skills/` 아래에 kebab-case 디렉터리를 만듭니다.
2. `SKILL.md`를 추가하고 [docs/skill-anatomy.md](docs/skill-anatomy.md)의 형식을 따릅니다.
3. YAML frontmatter에 `name`과 `description`을 둡니다.
4. `description`에는 스킬이 무엇을 하는지와 `Use when` 트리거 조건을 포함합니다.
5. helper script가 필요할 때만 `scripts/`를 추가합니다.

## 품질 기준

- 구체적이어야 합니다. 추상적인 조언보다 실행 가능한 절차를 씁니다.
- 검증 가능해야 합니다. 완료 증거가 명확해야 합니다.
- 실제 엔지니어링 워크플로에 기반해야 합니다.
- Codex가 필요할 때만 본문을 읽는다는 전제에 맞게 간결해야 합니다.

## 기존 스킬 수정

- `skills/` 원본을 먼저 수정합니다.
- 변경은 가능한 한 작게 유지합니다.
- frontmatter와 필수 섹션이 검증을 통과하는지 확인합니다.
- 수정 후 Codex 미러와 플러그인 번들을 동기화합니다.

```bash
node scripts/sync-codex-skills.js
```

## Hook 수정

Codex SessionStart hook은 `hooks/session-start.sh`와 `hooks/codex-session-start.js`가 담당합니다. 출력은 Codex 형식인 `hookSpecificOutput.additionalContext`를 사용해야 합니다.

Hook 관련 파일을 바꿨다면 다음 테스트를 실행합니다.

```bash
bash hooks/session-start-test.sh
```

기대 출력:

```text
Codex session-start JSON payload OK
```

## 배포 전 검증

```bash
node scripts/sync-codex-skills.js --check
node scripts/validate-skills.js
node scripts/validate-codex.js
bash hooks/session-start-test.sh
```

## 이슈 제보

다음 경우 이슈를 열어 주세요.

- 스킬 지침이 부정확하거나 오래된 경우
- 자주 쓰는 엔지니어링 워크플로가 빠진 경우
- 스킬, 미러, 플러그인 번들 사이에 불일치가 있는 경우

## License

기여 내용은 MIT License로 배포됩니다.
