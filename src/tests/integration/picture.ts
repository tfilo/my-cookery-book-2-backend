import { Server } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import {
    PostgreSqlContainer,
    StartedPostgreSqlContainer,
    Wait,
} from 'testcontainers';

dotenv.config({ path: path.join('src', 'tests', '.env') });

import { app } from '../../app';
import sequelize from '../../util/database';
import { Configuration, PictureApi } from '../openapi';
import Chai from 'chai';
import chaiExclude from 'chai-exclude';
import createUsers from '../data/user-data';
import createCategories from '../data/category-data';
import createUnits from '../data/unit-data';
import createUnitCategories from '../data/unitCategory-data';
import createRecipes from '../data/recipe-data';
import createTags from '../data/tag-data';
import createPictures from '../data/picture-data';
import User from '../../models/database/user';
import { issueToken } from '../../util/token';
import Picture from '../../models/database/picture';
import Recipe from '../../models/database/recipe';
import { processError } from '../util/error';
import { buffer } from 'stream/consumers';

Chai.use(chaiExclude);
const expect = Chai.expect;

const port = process.env.PORT || 13000;

let token: string;
const setToken = (t: string) => {
    token = t;
};
const getToken = () => {
    return token;
};

const config = new Configuration({
    authorization: () => getToken(),
    basePath: 'http://localhost:' + port + process.env.BASE_PATH,
});

describe('Picture', () => {
    let users: { [key: string]: User };
    let pictures: { [key: string]: Picture };
    let recipes: { [key: string]: Recipe };
    let serverInstance: Server;
    let databaseContainer: StartedPostgreSqlContainer;
    const pictureApi = new PictureApi(config);

    before(async () => {
        databaseContainer = await new PostgreSqlContainer(
            'postgres:14.5-alpine'
        )
            .withDatabase('cookery2')
            .withUsername('cookery2')
            .withPassword('cookery2123')
            .withExposedPorts({
                container: 5432,
                host: Number(process.env.DATABASE_PORT ?? 15432),
            })
            .withWaitStrategy(
                Wait.forLogMessage(
                    '[1] LOG:  database system is ready to accept connections'
                )
            )
            .start();
        serverInstance = app.listen(port);
    });

    after(async () => {
        serverInstance.close();
        await databaseContainer.stop();
    });

    afterEach(async () => {
        await sequelize.dropAllSchemas({
            benchmark: false,
            logging: false,
        });
        setToken('');
    });

    beforeEach(async () => {
        await sequelize.sync({ force: true });
        users = await createUsers();
        const unitCategories = await createUnitCategories();
        const units = await createUnits(unitCategories);
        const categories = await createCategories();
        const tags = await createTags();
        const recipesData = await createRecipes(tags, units, categories, users);
        recipes = recipesData.recipes;
        pictures = await createPictures(recipes);
    });

    it('should get all pictures of recipe', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await pictureApi
            .getPicturesByRecipe(recipes.chicken.id)
            .catch(processError);
        expect(res).has.lengthOf(1);
        expect(res).to.eql([
            {
                id: pictures.sample.id,
                name: pictures.sample.name,
                sortNumber: pictures.sample.sortNumber,
            },
        ]);
    });

    it('should try get all pictures of recipe and fail on authentication', async () => {
        const res = await pictureApi
            .getPicturesByRecipe(recipes.chicken.id)
            .catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: '',
        });
    });

    it('should try get pictures of non existing recipe and get empty array', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await pictureApi
            .getPicturesByRecipe(9999999)
            .catch(processError);
        expect(res).has.lengthOf(0);
    });

    it('should get picture thumbnail by id', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await pictureApi
            .getPictureThumbnail(pictures.sample.id)
            .catch(processError);
        const thumbnail = fs.readFileSync(
            path.join(__dirname, '..', 'data', 'thumbnail.jpg')
        );
        expect(res).to.be.eql(thumbnail);
    });

    it('should try get picture thumbnail by id and fail on authentication', async () => {
        const res = await pictureApi
            .getPictureThumbnail(pictures.sample.id)
            .catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: '',
        });
    });

    it('should try get picture thumbnail by id and fail on picture not exists', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await pictureApi
            .getPictureThumbnail(9999999)
            .catch(processError);
        expect(res).to.eql({
            statusCode: 404,
            code: 'NOT_FOUND',
            message: '',
        });
    });

    it('should get picture by id', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await pictureApi
            .getPictureData(pictures.sample.id)
            .catch(processError);
        const picture = fs.readFileSync(
            path.join(__dirname, '..', 'data', 'picture.jpg')
        );
        expect(res).to.be.eql(picture);
    });

    it('should try get picture by id and fail on authentication', async () => {
        const res = await pictureApi
            .getPictureData(pictures.sample.id)
            .catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: '',
        });
    });

    it('should try get picture by id and fail on picture not exists', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await pictureApi
            .getPictureData(9999999)
            .catch(processError);
        expect(res).to.eql({
            statusCode: 404,
            code: 'NOT_FOUND',
            message: '',
        });
    });

    it('should upload new picture', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const picture = fs.readFileSync(
            path.join(__dirname, '..', 'data', 'picture.jpg')
        );

        const res = await pictureApi
            .uploadPicture({
                file: {
                    value: picture,
                    filename: 'test.jpg',
                },
            })
            .catch(processError);

        expect(res.id).to.be.a('number');

        const data = await pictureApi
            .getPictureData(res.id)
            .catch(processError);

        expect(data).has.length.least(269000);

        const thumbnail = await pictureApi
            .getPictureThumbnail(res.id)
            .catch(processError);

        expect(thumbnail).has.length.least(48000);
    });

    it('should try to upload new picture and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.simple);
        setToken(token);

        const picture = fs.readFileSync(
            path.join(__dirname, '..', 'data', 'picture.jpg')
        );

        const res = await pictureApi
            .uploadPicture({
                file: {
                    value: picture,
                    filename: 'test.jpg',
                },
            })
            .catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: '',
        });
    });

    it('should try to upload new picture and fail on filetype', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const text = fs.readFileSync(
            path.join(__dirname, '..', 'data', 'test.txt')
        );

        const res = await pictureApi
            .uploadPicture({
                file: {
                    value: text,
                    filename: 'Test file',
                },
            })
            .catch(processError);

        expect(res).to.eql({
            statusCode: 422,
            code: 'VALIDATION_FAILED',
            fields: {
                file: 'invalidValue',
            },
            message: '',
        });
    });
});
