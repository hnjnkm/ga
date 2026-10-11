# Poster Trail

그래픽 아카이브 이미지를 움직이는 영상으로 만드는 브라우저 앱입니다.
업로드한 프로젝트의 React 화면과 애니메이션 소스를 그대로 사용합니다.

## 실행

Node.js 22 이상에서:

```sh
npm ci
npm run dev
```

이미지를 업로드하고 트레일, 버스트, 공전, 반발, 중력, 축구, 컷 모드를 선택하세요.
캔버스 비율과 모드별 설정을 조절할 수 있습니다.
`R` 키로 녹화를 시작하고, 다시 `R`을 누르면 영상을 다운로드합니다.
브라우저 지원에 따라 MP4 또는 WebM으로 저장됩니다.
이미지는 브라우저 메모리에서 처리되며 서버로 업로드되지 않습니다.

## 빌드와 배포

```sh
npm run build
npm run preview
```

GitHub 저장소의 **Settings → Pages → Build and deployment → Source**를
**GitHub Actions**로 설정하세요. `main`에 푸시하면 Pages 배포 워크플로가 실행됩니다.
설정을 변경한 뒤에는 Actions에서 **Deploy to GitHub Pages → Run workflow**로 다시 실행할 수 있습니다.
배포가 성공하면 Pages 설정이나 워크플로에 실제 사이트 주소가 표시됩니다.

Windows에서 제공된 `실행.bat`도 사용할 수 있습니다.
