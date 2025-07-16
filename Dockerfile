##
#   builder stage
##

FROM node:22-alpine AS builder

# working directory
WORKDIR /src/app/

#dependencies
COPY package*.json ./
RUN npm install --omit=development

#copy and compile
COPY . .
RUN npm run build



##
#  runner stage
##

FROM node:22-alpine AS runner
WORKDIR /usr/src/app

COPY --from=builder /src/app/dist ./dist
COPY --from=builder /src/app/node_modules ./node_modules
COPY --from=builder /src/app/package*.json ./
COPY --from=builder /src/app/scripts ./scripts

CMD ["node", "dist/main.js"]
