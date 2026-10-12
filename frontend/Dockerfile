FROM node:18-alpine

WORKDIR /app

# Package files 복사
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 코드 복사
COPY . .

# 포트 노출
EXPOSE 3000

# 개발 모드로 실행
CMD ["npm", "run", "dev"]