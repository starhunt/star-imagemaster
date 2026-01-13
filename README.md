# Image Master

Obsidian용 올인원 이미지 관리 플러그인입니다. 이미지 저장, 갤러리, 중복 감지, 고아 이미지 정리를 하나의 플러그인에서 해결합니다.

## 주요 기능

### 이미지 자동 저장
- 클립보드 붙여넣기 또는 드래그 앤 드롭 시 설정된 경로로 자동 저장
- 다양한 저장 모드 지원 (폴더 기반, 중앙 집중형, 날짜 기반 등)
- 파일명 패턴 커스터마이징 (타임스탬프, UUID, 원본명 등)

### 통합 이미지 갤러리
- **그리드 뷰**: 썸네일 기반 시각적 탐색
- **리스트 뷰**: 테이블 형식으로 상세 정보 확인
- **필터 탭**: 전체 / 사용 중 / 고아 이미지 분류
- **다중 선택**: Ctrl+클릭, Shift+클릭, Ctrl+A 지원
- **벌크 작업**: 선택한 이미지 일괄 삭제/이동
- **정렬**: 이름, 크기, 생성일, 수정일, 폴더별 정렬
- **드래그 & 드롭**: 갤러리에서 에디터로 이미지 삽입

### 중복 감지
- SHA-256 해시 기반 동일 이미지 감지
- 중복 이미지 발견 시 기존 이미지 링크 재사용
- 불필요한 파일 중복 방지

### 고아 이미지 관리
- 어떤 노트에서도 참조되지 않는 이미지 자동 감지
- 갤러리에서 고아 이미지 확인 및 정리
- 일괄 삭제 또는 지정 폴더로 이동

### 링크 자동 업데이트
- 이미지 파일 이동/이름 변경 시 모든 참조 노트 링크 자동 갱신

---

## 설치 방법

### 수동 설치

1. [Releases](https://github.com/starhunt/star-imagemaster/releases) 페이지에서 최신 버전 다운로드
2. 다음 파일들을 다운로드:
   - `main.js`
   - `manifest.json`
   - `styles.css`
3. Vault의 플러그인 폴더에 `star-imagemaster` 폴더 생성:
   ```
   {your-vault}/.obsidian/plugins/star-imagemaster/
   ```
4. 다운로드한 파일들을 해당 폴더에 복사
5. Obsidian 재시작 또는 플러그인 목록 새로고침
6. 설정 → Community plugins에서 "Image Master" 활성화

### BRAT 설치 (베타 테스트용)

1. [BRAT](https://github.com/TfTHacker/obsidian42-brat) 플러그인 설치
2. BRAT 설정에서 "Add Beta plugin" 클릭
3. `starhunt/star-imagemaster` 입력 후 추가

---

## 사용법

### 갤러리 열기

- 명령어 팔레트(`Ctrl/Cmd + P`)에서 "Image Master: Open Gallery" 실행
- 또는 단축키 `Ctrl/Cmd + Shift + G` 사용 (설정에서 변경 가능)

### 이미지 탐색

| 동작 | 방법 |
|------|------|
| 뷰 모드 전환 | 헤더의 그리드/리스트 아이콘 클릭 |
| 필터 변경 | All / In Use / Orphan 탭 클릭 |
| 검색 | 검색창에 파일명 또는 경로 입력 |
| 정렬 | 리스트 뷰에서 컬럼 헤더 클릭, 그리드 뷰에서 정렬 드롭다운 사용 |

### 이미지 선택

| 동작 | 방법 |
|------|------|
| 단일 선택 | 이미지 클릭 |
| 다중 선택 (토글) | `Ctrl/Cmd + 클릭` |
| 범위 선택 | `Shift + 클릭` |
| 전체 선택 | `Ctrl/Cmd + A` |
| 선택 해제 | `Escape` |

### 벌크 작업

이미지를 선택하면 액션 툴바가 나타납니다:

- **Delete**: 선택된 고아 이미지 삭제 (사용 중인 이미지는 삭제 불가)
- **Move to...**: 선택된 이미지를 다른 폴더로 이동
- **Deselect**: 선택 해제

### 이미지 삽입

- **더블 클릭**: 현재 활성화된 노트에 이미지 링크 삽입
- **드래그 & 드롭**: 갤러리에서 에디터로 이미지 드래그

### 이미지 정보

이미지를 선택하면 우측에 정보 패널이 표시됩니다:
- 파일명, 크기, 해상도, 포맷
- 생성일, 수정일
- 참조하는 노트 목록
- 빠른 액션 버튼 (열기, 이름 변경, 삭제 등)

---

## 키보드 단축키

| 단축키 | 동작 |
|--------|------|
| `Ctrl/Cmd + Shift + G` | 갤러리 열기 |
| `Arrow` 키 | 이미지 탐색 (그리드 뷰) |
| `Enter` / `Space` | 이미지 선택 |
| `Ctrl/Cmd + A` | 전체 선택 |
| `Escape` | 선택 해제 |
| `Delete` / `Backspace` | 선택된 고아 이미지 삭제 |

---

## 설정

### 저장 모드

| 모드 | 설명 | 예시 경로 |
|------|------|-----------|
| **폴더 기반** (기본값) | 노트 폴더 내에 `{폴더명}_img` 서브폴더 생성 | `notes/project/project_img/image.png` |
| **중앙 집중형** | 모든 이미지를 단일 폴더에 저장 | `attachments/image.png` |
| **날짜 기반** | 연/월 하위 폴더로 분류 | `attachments/2026/01/image.png` |
| **노트 동일 위치** | 노트와 같은 폴더에 저장 | `notes/project/image.png` |
| **노트명 폴더** | 노트 이름으로 하위 폴더 생성 | `attachments/MyNote/image.png` |

### 파일명 패턴

| 패턴 | 예시 |
|------|------|
| `original` | `screenshot.png` |
| `timestamp` | `20260113_143052_screenshot.png` |
| `uuid` | `a1b2c3d4.png` |
| `custom` | `{note}_{timestamp}.{ext}` |

### 링크 형식

| 형식 | 예시 |
|------|------|
| 위키링크 | `![[image.png]]` |
| 위키링크 + 경로 | `![[attachments/image.png]]` |
| 마크다운 상대 경로 | `![](./attachments/image.png)` |
| 마크다운 절대 경로 | `![](/attachments/image.png)` |

---

## 폴더 구조 예시

```
Vault/
├── notes/
│   ├── project/
│   │   ├── project_img/           # 이미지 폴더 (폴더 기반 모드)
│   │   │   ├── screenshot.png
│   │   │   └── diagram.png
│   │   ├── ProjectNote.md
│   │   └── AnotherNote.md
│   └── personal/
│       ├── personal_img/
│       │   └── photo.png
│       └── Diary.md
└── _orphaned/                     # 고아 이미지 이동 폴더 (선택)
```

---

## FAQ

### Q: 폴더 이름을 변경하면 이미지 폴더도 변경되나요?

A: 아니요. 이미지 폴더 이름은 그대로 유지됩니다. 새로운 이미지를 추가하면 기존 `*_img` 폴더가 있을 경우 해당 폴더를 재사용합니다. 이는 폴더명 변경 시 모든 이미지 링크를 업데이트해야 하는 부담을 줄이기 위함입니다.

### Q: 사용 중인 이미지도 삭제할 수 있나요?

A: 아니요. 안전을 위해 노트에서 참조 중인 이미지는 갤러리에서 삭제할 수 없습니다. 고아 이미지(Orphan)만 삭제 가능합니다.

### Q: 중복 이미지는 어떻게 처리되나요?

A: 동일한 이미지를 붙여넣을 때 SHA-256 해시를 비교하여 이미 존재하는 이미지가 발견되면 새 파일을 생성하지 않고 기존 이미지 링크를 재사용합니다.

---

## 라이선스

MIT License

## 기여

버그 리포트, 기능 제안, PR 환영합니다.
- [Issues](https://github.com/starhunt/star-imagemaster/issues)
- [Pull Requests](https://github.com/starhunt/star-imagemaster/pulls)
