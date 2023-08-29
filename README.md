# My cookery book 2 - backend ![tests](https://github.com/tfilo/my-cookery-book-2-backend/actions/workflows/node.js.yml/badge.svg?branch=main)

Backend application providing RestApi build on Express and Node.js. Whole backend is writen in Typescript.

## Technologies required for development

-   Node.js (>=18)
-   Docker (>=20.10.14)
-   Docker compose (>=2.10.2)

## Development

While development it is required to have Postgres database running. It can be runned by prepared `docker-compose.yaml` file. This development environment can be started by command:

-   `docker compose up -d`

It will run pgAdmin on port 8081 and database on port 5432.

After database is running, you can start development server by commands:

-   `npm install` (only if you didn't run it before or you modifed package.json file)
-   `npm run start:dev`

It will run node.js app on port 8080 and internal api for sending notifications on port 8081. It will use environment variables defined inside `.env` file where you can optionaly modify port, basepath etc. If you modified docker-compose.yaml you need modify accordingly this file too to ensure correct configuration of database.

When you are done with development, don't forget to stop database server by running command:

-   `docker compose down`

## Tests

There (will be) integration and unit tests available. You can run it by

-   `npm run tests` - to run all tests
-   `npm run tests:unit` - to run unit tests only
-   `npm run tests:integration` - to run integration tests only

### Usefull links

| Name                            | URL                                     | Description                                      |
| ------------------------------- | --------------------------------------- | ------------------------------------------------ |
| Backend                         | http://localhost:8080/api               | API                                              |
| Backend Health check            | http://localhost:8080/api/health        | Health check                                     |
| Backend Swagger Api             | http://localhost:8080/api/api-docs      | OpenApi 3 documentation                          |
| Backend - internal              | http://localhost:8081/internal          | API                                              |
| Backend Health check - internal | http://localhost:8081/internal/health   | Health check                                     |
| Backend Swagger Api - internal  | http://localhost:8081/internal/api-docs | OpenApi 3 documentation                          |
| pgAdmin                         | http://localhost:8082                   | Database administration. Password *cookery2123*  |

## Before commit

Please before every commit run

-   `npm run lint`

and fix any errors or warnings if possible. It will ensure to have consistent code styling.

## Environment variables

| Name                                | Type of value | Default          | Required | Description                                                                                                          |
| ----------------------------------- | ------------- | ---------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| NODE_ENV                            | string        |                  |          | Environment 'development' or 'production'                                                                            |
| PORT                                | number        | 8080             |          | Port where backend api will run                                                                                      |
| PORT_INTERNAL                       | number        | 8081             |          | Port where internal backend api will run                                                                             |
| BASE_PATH                           | string        | /api             |          | Base path of api                                                                                                     |
| INTERNAL_PATH                       | string        | /internal        |          | Path of internal api                                                                                                 |
| NOTIFICATION_RANGE_DAYS             | number        | 1                |          | When sending notification, how many day back look for new recipes                                                    |
| TOKEN_SIGN_KEY                      | string        |                  | true     | Secrete or private key                                                                                               |
| TOKEN_VALIDITY                      | string        | 1h               |          | Length of token validity 1m, 1h, 1d                                                                                  |
| REFRESH_TOKEN_VALIDITY              | string        | 30d              |          | Length of refresh token validity 1m, 1h, 1d ...                                                                      |
| DATABASE_PASSWORD                   | string        |                  | true     | Password to database                                                                                                 |
| DATABASE_USER                       | string        |                  | true     | Username to database                                                                                                 |
| DATABASE                            | string        |                  | true     | Name of database                                                                                                     |
| DATABASE_HOST                       | string        |                  | true     | Host of database                                                                                                     |
| DATABASE_PORT                       | number        | 5432             |          | Port of database                                                                                                     |
| DATABASE_LOGGING                    | boolean       | true             |          | If sequelize should log generated queries                                                                            |
| LOGGING_ERROR                       | boolean       | true             |          | If handled errors should be logged to console                                                                        |
| THUMBNAIL_DIMENSION                 | number        | 320              |          | Resolution of thumbnail                                                                                              |
| IMAGE_DIMENSION                     | number        | 1280             |          | Resolution of photo                                                                                                  |
| EMAIL_HOST                          | string        | localhost        |          | Host of mail server                                                                                                  |
| EMAIL_PORT                          | number        | 1025             |          | Port of mail server                                                                                                  |
| EMAIL_USER                          | string        |                  |          | Username of mail server account                                                                                      |
| EMAIL_PASS                          | string        |                  |          | Password of mail server account                                                                                      |
| EMAIL_FROM                          | string        | test@noreply.com |          | Email from to send emails                                                                                            |
| RESET_LINK_VALIDITY                 | number        | 12               |          | How many hours is link valid                                                                                         |
| MAIL_CONFIRM_SUBJECT                | string        |                  |          | Email subject                                                                                                        |
| MAIL_CONFIRM_TEMPLATE_TXT_HBS       | string        |                  |          | Plain text handlebars template, variables: fullName: string, key: string, username: string                           |
| MAIL_CONFIRM_TEMPLATE_HTML_HBS      | string        |                  |          | HTML handlebars template: fullName: string, key: string, username: string                                            |
| MAIL_NOTIFICATION_SUBJECT           | string        |                  |          | Email subject                                                                                                        |
| MAIL_NOTIFICATION_TEMPLATE_TXT_HBS  | string        |                  |          | Plain text handlebars template, variables: fullName: string, recipes: {name: string, id: number}[], username: string |
| MAIL_NOTIFICATION_TEMPLATE_HTML_HBS | string        |                  |          | HTML handlebars template: fullName: string, recipes: {name: string, id: number}[], username: string                  |
| MAIL_RESET_SUBJECT                  | string        |                  |          | Email subject                                                                                                        |
| MAIL_RESET_TEMPLATE_TXT_HBS         | string        |                  |          | Plain text handlebars template, variables: fullName: string, key: string, username: string                           |
| MAIL_RESET_TEMPLATE_HTML_HBS        | string        |                  |          | HTML handlebars template: fullName: string, key: string, username: string                                            |

## Building docker image

There is provided Dockerfile and sh script build-image.sh. You can use this script to build docker image.

## License

Project is licensed under [MIT](./LICENSE.txt) License. There are 3rd party libraries which can be part of builded docker images. List of this libraries can be found in [LIBRARIES](./LIBRARIES). Other than that this project use development libraries too. Please look at [package.json](./package.json) if you are interested in complete list of direct dependencies of this project.

## How to update list of used libraries

If added new dependencies, list of used libraries can be updated using this script

./generateLibrariesNotice.sh

WHILE RUNNING IT WILL INSTANLL GLOBALLY license-report LIBRARY
