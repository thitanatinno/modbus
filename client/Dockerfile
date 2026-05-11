# Stage 1: Build React app
FROM node:18-alpine AS build

WORKDIR /app

# REACT_APP_* vars must be available at build time
ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output into the path matching homepage: "/dashboard-local"
COPY --from=build /app/build /usr/share/nginx/html/dashboard-local

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
