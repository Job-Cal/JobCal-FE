# html.to.design용 페이지 파일

## 파일
- home-calendar.html
- home-list.html
- login.html
- oauth-callback.html

## 사용 방법
1. html.to.design 플러그인에서 `Import from URL`을 사용하면 가장 안정적입니다.
2. 프로젝트 루트에서 아래 실행:

```bash
cd /Users/minty/JM/JobCal/app/JobCal-FE
npx serve figma-export/html-to-design -l 4173
```

3. 플러그인에 아래 URL 입력:
- http://localhost:4173/home-calendar.html
- http://localhost:4173/home-list.html
- http://localhost:4173/login.html
- http://localhost:4173/oauth-callback.html

## 참고
- 현재 파일은 html.to.design에 맞춘 정적 시안용 HTML입니다.
- 실제 React 컴포넌트와 1:1 런타임 동작(모달 상태, API 데이터)은 포함하지 않았습니다.
