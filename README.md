# Ink-Wise

> 사진을 펜 드로잉으로 변환하는 웹앱 — 필터가 아니라 **그리는 과정**을 보여줍니다.

![Ink-Wise](https://img.shields.io/badge/status-active-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Vanilla JS](https://img.shields.io/badge/vanilla-JS-yellow)

## 개요

Ink-Wise는 업로드한 사진을 펜 드로잉 스타일로 실시간 변환합니다. 핵심은 단순한 필터 효과가 아니라, **펜이 실제로 선을 따라가며 그림이 완성되는 path tracing 애니메이션**입니다. 에지 검출, 경로 체이닝, 크로스 해칭까지 순수 Canvas API만으로 구현했습니다.

## 기능

### 이미지 처리 파이프라인
1. **Grayscale** — Luminance-weighted 변환 (0.299R + 0.587G + 0.114B)
2. **Gaussian Blur** — 노이즈 제거 (configurable radius)
3. **Sobel Edge Detection** — Gradient magnitude + direction
4. **Path Extraction** — Edge 픽셀을 연결된 경로로 체이닝 (8방향 + 방향 연속성 보너스)
5. **Cross-Hatching** — 밝기 기반 대각선 빗금 (어두운 영역: 교차 빗금)
6. **Paper Texture** — 노이즈 오버레이

### 3가지 애니메이션 모드
- **Path Trace** _(시그니처)_ — 추출된 경로를 따라 빨간 펜 점이 실시간 이동하며 선을 그음
- **Scanline** — 위→아래 스캔라인 방식으로 드로잉 공개
- **Radial** — 중심→바깥 원형 확산

### 3가지 스타일
| Style | Background | Line | Hatching |
|-------|-----------|------|---------|
| **Ink** | `#f5f0e8` (크래프트 종이) | `#1a1a1a` | `#333333` |
| **Blueprint** | `#1a2744` (청사진) | `#5fa8d3` | `#3d7aab` |
| **Pencil** | `#f8f6f0` | `#555555` | `#888888` |

## 사용법

```bash
# 클론 후 index.html 바로 열기 — 빌드 스텝 없음
git clone https://github.com/sigema0223/InkWise.git
cd InkWise
open index.html
# 또는 로컬 서버: python3 -m http.server 8080
```

> ES6 모듈을 사용하므로 `file://` 프로토콜 대신 로컬 HTTP 서버를 권장합니다.

## UI 컨트롤

| 컨트롤 | 범위 | 설명 |
|--------|------|------|
| Edge Threshold | 20–150 | 높을수록 강한 엣지만 검출 |
| Hatch Density | 0–100 | 해칭 선 밀도 |
| Speed | 1–5 | 애니메이션 속도 (paths/frame) |
| Replay | — | 애니메이션 재시작 |
| Download PNG | — | 결과 이미지 저장 |

## 기술 스택

- **Vanilla JS (ES6 Modules)** — 외부 라이브러리 없음
- **Canvas API** — 모든 이미지 처리 및 렌더링
- **Google Fonts** — Space Mono, Noto Serif KR

## 라이선스

MIT © 2026 Ink-Wise Contributors
