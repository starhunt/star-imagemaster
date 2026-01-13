# Star ImageMaster - Claude Code 프로젝트 컨텍스트

## 프로젝트 개요
Obsidian용 올인원 이미지 관리 플러그인. React + TypeScript 기반.

## 현재 버전
- **플러그인 버전**: 0.2.3
- **PRD 버전**: 2.3

## 핵심 기술 스택
- **UI**: React (JSX/TSX)
- **언어**: TypeScript
- **빌드**: esbuild
- **스타일**: CSS (Obsidian CSS 변수 사용)

## 중요한 구현 패턴

### Obsidian 환경 주의사항
1. **브라우저 API 제한**: `prompt()`, `confirm()` 등 브라우저 네이티브 다이얼로그가 Obsidian Electron 환경에서 동작하지 않을 수 있음
   - 대안: Obsidian의 `Modal`, `FuzzySuggestModal` 등 사용
   - 예: `src/ui/modals/FolderSuggestModal.ts`

2. **이미지 경로**: `app://local/` 형식이 아닌 `vault.adapter.getResourcePath()` 사용
   ```typescript
   const getResourcePath = (path: string) => plugin.app.vault.adapter.getResourcePath(path);
   ```

3. **파일 작업**: Obsidian Vault API 사용
   - `vault.getAbstractFileByPath()` - 파일 가져오기
   - `vault.rename()` - 파일 이동/이름 변경
   - `vault.delete()` - 파일 삭제
   - `vault.createFolder()` - 폴더 생성

### React 컴포넌트 구조
```
GalleryContainer (상태 관리)
├── ViewModeToggle (그리드/리스트 전환)
├── SortDropdown (정렬 옵션)
├── FilterTabs (전체/사용중/고아)
├── ActionToolbar (벌크 작업)
├── ImageGrid (그리드 뷰)
├── ImageList (리스트 뷰)
└── InfoPanel (상세 정보)
```

### 다중 선택 구현
- `selectedPaths: Set<string>` - 경로 기반 선택 관리
- `lastSelectedIndex: number | null` - Shift 클릭 범위 선택용
- Ctrl/Cmd + 클릭: 토글 선택
- Shift + 클릭: 범위 선택

### 폴더 기반 저장 모드 (folderBased)
- 이미지 폴더: `{부모폴더명}_img` 형식
- **폴더명 변경 시 동작**: 기존 `*_img` 폴더가 있으면 재사용 (이름 변경 안 함)
- `FileManager.findExistingImageFolder()` 메서드로 기존 폴더 탐색
- 이유: 폴더명 변경할 때마다 이미지 폴더 이름 변경 + 링크 업데이트 부담 방지

## 릴리즈 절차
1. `manifest.json` 버전 업데이트
2. `npm run build`
3. Git commit & push
4. `gh release create {version} main.js manifest.json styles.css --title "v{version}" --notes "..."`

## 알려진 이슈 / 해결된 이슈
- [해결] Move To 버튼 미동작 → `FolderSuggestModal` 도입 (v0.2.1)
- [해결] 이미지 썸네일 미표시 → `getResourcePath()` 사용 (v0.1.x)

## 주요 파일 위치
- 플러그인 엔트리: `src/main.ts`
- 설정: `src/settings.ts`
- 갤러리 메인: `src/ui/components/GalleryContainer.tsx`
- 타입 정의: `src/types/index.ts`
- 스타일: `styles.css`, `styles/styles.css`
- 문서: `doc/PRD.md`

## 설정 키 (PluginSettings)
- `imageFolder`: 이미지 저장 폴더
- `folderMode`: 저장 모드 (folder/central/date/note/noteName)
- `filenamePattern`: 파일명 패턴
- `galleryColumns`: 그리드 컬럼 수
- `thumbnailSize`: 썸네일 크기 (small/medium/large)
- `showFileInfo`: 정보 패널 표시 여부
- `orphanFolder`: 고아 이미지 이동 대상 폴더
