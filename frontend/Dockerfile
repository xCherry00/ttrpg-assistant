FROM node:20

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && update-ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm config set strict-ssl false
RUN npm install --include=optional
RUN npm install --no-save @rollup/rollup-linux-x64-gnu

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
