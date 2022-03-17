# = = = = = = = = = = = = = = = = = = = = = =
# Build Stage - This stage will intall node modules and build for prod
# = = = = = = = = = = = = = = = = = = = = = =
FROM mhart/alpine-node:14 as builder

RUN apk add --no-cache python make g++ git curl

COPY package*.json ./

#RUN npm install
# RUN npm ci --prod

# Uses package-lock to insure consistency/stablity
# Downloads the 'wait' utility and adds it to node modules
# Src: https://dev.to/kferrone/comment/em4h
RUN npm ci && \
    curl -L https://github.com/ufoscout/docker-compose-wait/releases/download/2.2.1/wait \
    -o ./node_modules/.bin/wait && \
    chmod +x ./node_modules/.bin/wait

COPY .babelrc ./
COPY postcss.config.js ./
COPY build/ build/
COPY config/ config/
COPY src/ src/

RUN npm run build

# = = = = = = = = = = = = = = = = = = = = = =
# Run stage
# This stage will run our app
# = = = = = = = = = = = = = = = = = = = = = =
FROM node:alpine

WORKDIR /home/node/app

USER node

# Copy over the node modules installed in the previous build
COPY --from=builder node_modules ./node_modules
COPY --from=builder dist/static ./dist/static

# Copy over local files
COPY --chown=node:node . .

# Copy local static files into the dist static folder
COPY static/* ./dist/static/

EXPOSE 2000

ENTRYPOINT [ "npm" ]

CMD [ "run", "start:docker" ]
