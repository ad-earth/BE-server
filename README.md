# 🌏 광고지구

- [구매자 서비스 주소](https://adearth.shop)
- [판매자 서비스 주소](https://adearth-admin.shop)
- [구매자 FE GitHub Repository](https://github.com/ad-earth/FE-client)
- [판매자 FE GitHub Repository](https://github.com/ad-earth/FE-admin)

## 1. Project Info

### 프로젝트 주제

- CPC 키워드 광고를 적용한 이커머스 플랫폼
- 구매자(지구샵 클론 코딩) 서비스와 판매자(판매자 광고 입찰) 서비스 개발

### 기획 배경

- 기존 CPC 키워드 광고주 페이지는 전달하고자 하는 정보의 양이 많아 UI가 복잡하게 설계됨
- 광고 입찰을 처음 이용하는 사용자에게 불편한 사용자 경험을 제공함

### 서비스 개발 목적

- 기존 CPC 키워드 광고주 페이지의 문제점들을 개선해 광고 입찰에 꼭 필요한 기능들만 선별하여 제공함으로써 사용자의 경험을 개선
- 편리하고 간편한 서비스를 광고주들에게 제공함으로써 신규 광고주 유입 효과 기대

### 프로젝트 타임라인

#### 기획 기간

- 2022.08.09 ~ 2022.08.21

#### 개발 기간

- 2022.08.22 ~ 2022.10.12

#### 리팩토링 기간

- 2022.10.12 ~

## 2. Team Info

| Name   | Position | GitHub                                      |
| ------ | -------- | ------------------------------------------- |
| 김다희 | Node.js  | [huitopia](https://github.com/huitopia)     |
| 이담   | React    | [damiiya](https://github.com/damiiya)       |
| 이효리 | React    | [hyooyh8910](https://github.com/hyooyh8910) |
| 조해솔 | React    | [sol-pine](https://github.com/sol-pine)     |
| 최수인 | React    | [whl5105](https://github.com/whl5105)       |

### 팀 협업

- Notion, Slack을 이용하여 스케줄 공유 및 회의 진행
- Postman을 이용하여 API 문서 공유
- HTTP 상태 코드를 사용하여 에러 공유

### API

- [Notion API 문서](https://huitopia.notion.site/huitopia/API-25004161e74048a18c6cdcdf024c502c)
- [Postman API 문서](https://documenter.getpostman.com/view/18707207/2s7Z7ZnZDy)

## 3. Project Architecture

<img width="100%" src="https://user-images.githubusercontent.com/87823892/210491178-cec73dd2-05bd-4902-9891-4b8b5886f1f7.jpeg">

## 4. Tech Stacks

| Name      | Tech       |
| --------- | ---------- |
| Server    | Node.js    |
| Language  | JavaScript |
| Database  | MongoDB    |
| Framework | Express.js |

## 5. Library

| Package      | version | Description                                      |
| ------------ | ------- | ------------------------------------------------ |
| bcryptjs     | ^2.4.3  | 비밀번호 해쉬화를 위한 라이브러리                |
| body-parser  | ^1.20.0 | 요청의 본문을 해석해주는 미들웨어                |
| cors         | ^2.8.5  | CORS 이슈 해결을 위한 라이브러리                 |
| dotenv       | ^16.0.2 | .env의 정보를 환경변수로 등록해주는 라이브러리   |
| express      | ^4.18.1 | 웹 서버를 구현하기 위한 라이브러리               |
| helmet       | ^6.0.0  | header에 설정을 통해 웹 취약점으로부터 서버 보호 |
| joi          | ^17.6.0 | 입력 데이터 유효성검사                           |
| jsonwebtoken | ^8.5.1  | jwt로그인 방식을 위한 라이브러리                 |
| mongoose     | ^6.5.4  | mongoDB 사용을 위한 확장 모듈                    |
| morgan       | ^1.10.0 | 통신 로그를 남기기 위한 라이브러리               |
