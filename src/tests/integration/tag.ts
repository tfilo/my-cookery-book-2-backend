import { Server } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import {
    PostgreSqlContainer,
    StartedPostgreSqlContainer,
    Wait,
} from 'testcontainers';

dotenv.config({ path: path.join('src', 'tests', '.env') });

import { app } from '../../app';
import sequelize from '../../util/database';
import { Configuration, TagApi } from '../openapi';
import Chai from 'chai';
import chaiExclude from 'chai-exclude';
import createUnitCategories from '../data/unitCategory-data';
import createUsers from '../data/user-data';
import createTags from '../data/tag-data';
import createUnits from '../data/unit-data';
import createCategories from '../data/category-data';
import createRecipes from '../data/recipe-data';
import User from '../../models/database/user';
import Tag from '../../models/database/tag';
import { issueToken } from '../../util/token';
import { processError } from '../utils/error';

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

describe('Tag', () => {
    let users: { [key: string]: User };
    let tags: { [key: string]: Tag };
    let serverInstance: Server;
    let databaseContainer: StartedPostgreSqlContainer;
    const tagApi = new TagApi(config);

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
        tags = await createTags();
    });

    it('should get all tags', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await tagApi.getTags().catch(processError);
        expect(res).has.lengthOf(Object.keys(tags).length);
        expect(res).to.eql(
            Object.keys(tags).map((k) => {
                return {
                    id: tags[k].id,
                    name: tags[k].name,
                };
            })
        );
    });

    it('should try get all tags and fail on authentication', async () => {
        // login and save token
        const res = await tagApi.getTags().catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: '',
        });
    });

    it('should get tag by id', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await tagApi.getTag(tags.meat.id).catch(processError);
        expect(res).to.eql({
            id: tags.meat.id,
            name: tags.meat.name,
            createdAt: tags.meat.createdAt.toISOString(),
            updatedAt: tags.meat.updatedAt.toISOString(),
        });
    });

    it('should try get tag by id and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await tagApi.getTag(tags.meat.id).catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: '',
        });
    });

    it('should try get tag by id and fail on tag not exists', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await tagApi.getTag(9999999).catch(processError);
        expect(res).to.eql({
            statusCode: 404,
            code: 'NOT_FOUND',
            message: '',
        });
    });

    it('should create tag', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await tagApi
            .createTag({
                name: 'NewTag',
            })
            .catch(processError);
        expect(res.id).to.be.a('number');
        expect(res.name).to.equal('NewTag');
        expect(res.createdAt).to.be.a('string');
        expect(res.updatedAt).to.be.a('string');
    });

    it('should try create tag and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await tagApi
            .createTag({
                name: 'NewTag',
            })
            .catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: '',
        });
    });

    it('should try create tag and fail on duplicity', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await tagApi
            .createTag({
                name: 'Meat',
            })
            .catch(processError);
        expect(res).to.eql({
            code: 'UNIQUE_CONSTRAINT_ERROR',
            fields: {
                name: 'not_unique',
            },
            statusCode: 409,
        });
    });

    it('should try create tag and fail on validation', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await tagApi
            .createTag({
                name: 'AbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghij1',
            })
            .catch(processError);

        expect(res).to.eql({
            message: '',
            code: 'VALIDATION_FAILED',
            fields: {
                name: {
                    key: 'maxLength',
                    values: {
                        max: 80,
                    },
                },
            },
            statusCode: 422,
        });

        const res2 = await tagApi
            .createTag({
                name: '',
            })
            .catch(processError);
        expect(res2).to.eql({
            message: '',
            code: 'VALIDATION_FAILED',
            fields: { name: 'required' },
            statusCode: 422,
        });
    });

    it('should update tag', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await tagApi
            .updateTag(tags.meat.id, {
                name: 'Meat2',
            })
            .catch(processError);
        expect(res.id).to.equal(tags.meat.id);
        expect(res.name).to.equal('Meat2');
        expect(res.createdAt).to.be.a('string');
        expect(res.updatedAt).to.be.a('string');
    });

    it('should try update tag and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await tagApi
            .updateTag(tags.meat.id, {
                name: 'Meat2',
            })
            .catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: '',
        });
    });

    it('should try update tag and fail on duplicity', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await tagApi
            .updateTag(tags.meat.id, {
                name: 'Vegetarian',
            })
            .catch(processError);
        expect(res).to.eql({
            code: 'UNIQUE_CONSTRAINT_ERROR',
            fields: {
                name: 'not_unique',
            },
            statusCode: 409,
        });
    });

    it('should try update tag and fail on validation', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await tagApi
            .updateTag(tags.meat.id, {
                name: 'AbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghij1',
            })
            .catch(processError);
        expect(res).to.eql({
            message: '',
            code: 'VALIDATION_FAILED',
            fields: {
                name: {
                    key: 'maxLength',
                    values: {
                        max: 80,
                    },
                },
            },
            statusCode: 422,
        });

        const res2 = await tagApi
            .updateTag(tags.meat.id, {
                name: '',
            })
            .catch(processError);
        expect(res2).to.eql({
            message: '',
            code: 'VALIDATION_FAILED',
            fields: { name: 'required' },
            statusCode: 422,
        });
    });

    it('should delete', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);
        const res = await tagApi.deleteTag(tags.meat.id).catch(processError);
        expect(res.status).to.equals(204);
    });

    it('should try delete tag and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await tagApi.deleteTag(tags.meat.id).catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: '',
        });
    });

    it('should try delete tag and fail on tag not exists', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await tagApi.deleteTag(9999999).catch(processError);
        expect(res).to.eql({
            statusCode: 404,
            code: 'NOT_FOUND',
            message: '',
        });
    });

    it('should try to delete tag and fail on constraints', async () => {
        // prepare recipes mock data with constraint to meat tag
        const unitCategories = await createUnitCategories();
        const units = await createUnits(unitCategories);
        const categories = await createCategories();
        await createRecipes(tags, units, categories, users);

        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await tagApi.deleteTag(tags.meat.id).catch(processError);
        expect(res).to.eql({
            statusCode: 409,
            code: 'CONSTRAINT_FAILED',
        });
    });

    it('should try delete tag and fail on authentication', async () => {
        // login and save token
        const res = await tagApi.deleteTag(tags.meat.id).catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: '',
        });
    });
});
