# My cookery book 2 - backend
This is backend in Node.js for My cookery book 2. All commands mentioned in this file should be runned inside `backend` directory.

## Technologies required for development
* Node.js (>=18)
* Docker (>=20.10.14)
* Docker compose (>=2.10.2)

## Development
While development it is required to have Postgres database running and some development mail server. Both can be runned by prepared `docker-compose.yaml` file inside `backend` directory. This development environment can be started by command:
* `docker compose up -d` 

It will run pgAdmin on port 8083 and database on port 5432.

After database is running, you can start development server by commands:
* `npm install` (only if you didn't run it before or you modifed package.json file)
* `npm run start:dev`

It will run node.js app. It will use environment variables defined inside `.env` file. If you modified docker-compose.yaml you need modify accordingly this file too.

When you are done with development, don't forget to stop development mail server and database by running command:
* `docker compose down`

## Before commit
Please before every commit run
* `npm run lint`

and fix any errors or warnings if possible. It will ensure to have consistent code styling.
