FROM node:18-alpine

WORKDIR /user/src/app

COPY . .

RUN npm i

CMD ["npm", "run", "start"]