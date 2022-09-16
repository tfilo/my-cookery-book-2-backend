# My cookery book 2
This application is personal cookery book. It's backend is based on Node.js and frontend in React. More information about [backend](./backend/README.md) and [frontend](./frontend/README.md) is in separated README.md files inside it's own directories.


## Build of docker images
Images can be build using script `build-images.sh`. It will create docker images for frontend and backend using Docker files Docker.frontend and Dockerfile.backend. After build of images you can try run application using `docker-compose up -d`. After successful startup it will provide following services:


| Name | URL | Description |
|---|---|---|
| Backend | http://localhost/api | API |
| Backend Health check | http://localhost/api/health | Health check |
| Backend Swagger Api | http://localhost/api/api-docs | OpenApi 3 documentation |
| Frontend | http://localhost | GUI |
| Mail | http://localhost:8082 | Development mail server |
| pgAdmin | http://localhost:8083 | Database administration. Password *cookery2123* |
| Postgres | N/A | Database server running internally in docker compose network |

Ports, passwords and other for production can be changed in `docker-compose.yaml` or it can be run by docker swarm, kubernetes or another orchestration service capable of running docker images.

## Environment variables

### Backend

| Name | Type of value | Default | Required | Description |
|---|---|---|---|---|
| NODE_ENV | string |||Environment 'development' or 'production'
| PORT | number | 3000 ||Port where backend api will run|
| BASE_PATH | string | /api ||Base path of api|
| TOKEN_SIGN_KEY | string || true |Secrete or private key|
| TOKEN_VALIDITY | string |1h||Length of token validity 1m, 1h, 1d|
| REFRESH_TOKEN_VALIDITY | string |10d||Length of refresh token validity 1m, 1h, 1d ...|
| DATABASE_PASSWORD | string || true |Password to database|
| DATABASE_USER | string || true |Username to database|
| DATABASE | string||true|Name of database|
| DATABASE_HOST | string || true |Host of database|
| DATABASE_PORT | number | 5432 ||Port of database|
| DATABASE_LOGGING | boolean |true||If sequelize should log generated queries|
| LOGGING_ERROR | boolean | true ||If handled errors should be logged to console|
| THUMBNAIL_DIMENSION | number |320|| Reset url for reset emails|
| IMAGE_DIMENSION | number |1280|| Reset url for reset emails|

### Frontend

| Name | Type of value | Default | Description |
|---|---|---|---|

## License
Project is licensed under [MIT](./LICENSE) License. There are 3rd party libraries which can be part of builded docker images. List of this libraries can be found in [LIBRARIES](./backend/LIBRARIES) for backend and [LIBRARIES](./frontend/LIBRARIES) for frontend. Other than that this project use development libraries too. Please look at package.json in backend and frontend folder if you are interested in complete list of direct dependencies of this project.

## How to update list of used libraries

If added new dependencies, list of used libraries can be updated using this script

./generateLibrariesNotice.sh

WHILE RUNNING IT WILL INSTANLL GLOBALLY license-report LIBRARY