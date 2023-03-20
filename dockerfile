FROM node:18-alpine

WORKDIR /user/src/app

COPY . .

RUN npm i

RUN npm run build  

CMD ["npm", "run", "start"]