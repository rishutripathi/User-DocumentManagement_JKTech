# Development stage
FROM node:22-alpine AS development

# working directory
WORKDIR /src/app/

# dependencies
COPY package*.json ./

# install all dependencies
RUN npm ci

COPY . .

# Expose PORT
EXPOSE 8000

CMD [ "npm", "run", "start:dev" ]


# Production stage
FROM node:22-alpine AS production

# working directory
WORKDIR /src/app/

# dependencies
COPY package*.json ./

# install all dependencies
RUN npm ci --omit=dev

COPY . .

# build application
RUN npm run build

# Expose PORT
EXPOSE 8000

CMD [ "npm", "run", "start:prod" ]