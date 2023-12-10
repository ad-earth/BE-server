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

- [Notion API 문서](https://huitopia.notion.site/API-69a626bd3b964e8ba538a4f57d3ea589?pvs=4)
- [Postman API 문서](https://documenter.getpostman.com/view/18707207/2s7Z7ZnZDy)

## 3. Project Architecture

<img width="100%" src="https://user-images.githubusercontent.com/87823892/210491178-cec73dd2-05bd-4902-9891-4b8b5886f1f7.jpeg">

## 4. DB

### ERD

- [ERD Diagram](https://www.erdcloud.com/d/XYfwe6jGyuuxXBgiL)

  <img width="100%" src="https://user-images.githubusercontent.com/87823892/210501277-f0df2aec-1071-4510-a9c3-f512c348e691.png">

### Schema

- [Notion Schema](https://huitopia.notion.site/DB-4f21ae9abe784d82bf08b73c70355dc2?pvs=4)

## 5. Tech Stacks

| Name      | Tech       |
| --------- | ---------- |
| Server    | Node.js    |
| Language  | JavaScript |
| Database  | MongoDB    |
| Framework | Express.js |

## 6. Library

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

### bcryptjs

- 비밀번호를 해시 암호화해 저장하는 모듈로 기존 bcrypt 사용하였으나 잦은 에러 발생으로 알아보니, bcrypt는 C++기반의 node 라이브러리로 사용을 위해서 OS에 python과 C++등이 설치되어야 한다. 노트북을 변경하면서 순수 자바스크립트만 설치되어 있기에 이에 비슷한 모듈을 찾다 javascript로만 만들어진 bcryptjs를 설치하여 진행했다.

### jsonwebtoken

- 세션 방식은 서버의 메모리 내부에 유저의 정보를 저장한다. 유저의 수가 증가할수록 세션의 양이 많아지는 만큼 메로이에 부하가 걸릴 수 있어 JWT 토큰 인증 방식을 이용하였다. JWT는 서버의 메모리에 저장 공간을 확보하지 않고 토큰 발급 및 확인 절차만 거치므로 서버 자원과 비용을 절감할 수 있다.

### helmet

- 서버에서 다양한 HTTP 헤더를 자동 설정을 통해 서버 어플리케이션의 보안을 강화해주는 대표적은 노드 보안 모듈이다. 적용 전 Response Headers에는 Server와 X-Powered-By 헤더가 노출되어 서버에서 사용중인 웹 서버 소프트웨어의 종류를 알기 쉽다. 밑의 사진은 helmet을 적용 후의 Response Headers이다. Server와 X-Powered-By 헤더의 정보가 사라져 해커에게 제공될 수 있던 서버의 주요 정보가 대부분 사라졌다. 헤더를 숨긴다고 하여 보안이 완벽한 것은 아니지만 잠재적으로 취약한 기술이 있는지 파악하는 것을 어렵게하여 공격의 전체적인 진행을 약간 늦추는 정도의 효과를 발휘한다.

<img width="60%" src="https://user-images.githubusercontent.com/87823892/210496088-98dddc9c-ff82-44b3-9477-83620af8d072.png">

### morgan

- 서버의 로그 관리를 위한 미들웨어이며, 서비스 동작 상태 파악을 위해 사용하였다. 로그에 나오는 에러 코드와 IP를 확인하여 요청의 성공 여부를 파악하기 편리하다.

## 7. 페이지 기능

- [Notion](https://huitopia.notion.site/8ec65ea5d97c40998d5279ee0723e037?pvs=4)
