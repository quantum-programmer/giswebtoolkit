FROM node:18.20.4-bullseye

# создание директории приложения
WORKDIR /usr/src/app

COPY package*.json .

RUN npm set registry http://npm.panorama.local/

RUN npm install
