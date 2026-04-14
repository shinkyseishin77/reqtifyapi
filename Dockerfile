FROM node:20-alpine

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# Generate prisma client
RUN npx prisma generate

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
