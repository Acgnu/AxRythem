FROM docker.io/library/nginx:stable-alpine

COPY index.html favorite.ico /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY script/ /usr/share/nginx/html/script/
COPY sheets/ /usr/share/nginx/html/sheets/
COPY imgs/ /usr/share/nginx/html/imgs/
COPY audio/ /usr/share/nginx/html/audio/

EXPOSE 80
