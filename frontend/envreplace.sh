#!/bin/sh

cd /usr/share/nginx/html/
envsubst < index.html > index_rep.html
mv index_rep.html index.html
