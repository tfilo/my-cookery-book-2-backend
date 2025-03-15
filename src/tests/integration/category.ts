import { Server } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { Wait } from 'testcontainers';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

dotenv.config({ path: path.join('src', 'tests', '.env') });

import { app } from '../../app';
import sequelize from '../../util/database';
import { CategoryApi, Configuration } from '../openapi';
import { use, expect } from 'chai';
import chaiExclude from 'chai-exclude';
import createUsers from '../data/user-data';
import createCategories from '../data/category-data';
import createUnits from '../data/unit-data';
import createUnitCategories from '../data/unitCategory-data';
import createRecipes from '../data/recipe-data';
import createTags from '../data/tag-data';
import User from '../../models/database/user';
import { issueToken } from '../../util/token';
import Category from '../../models/database/category';
import { processError } from '../util/error';

use(chaiExclude);

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
    basePath: 'http://localhost:' + port + process.env.BASE_PATH
});

describe('Category', () => {
    let users: { [key: string]: User };
    let categories: { [key: string]: Category };
    let serverInstance: Server;
    let databaseContainer: StartedPostgreSqlContainer;
    const categoryApi = new CategoryApi(config);

    before(async () => {
        databaseContainer = await new PostgreSqlContainer('postgres:17-alpine')
            .withDatabase('cookery2')
            .withUsername('cookery2')
            .withPassword('cookery2123')
            .withExposedPorts({
                container: 5432,
                host: Number(process.env.DATABASE_PORT)
            })
            .withWaitStrategy(Wait.forLogMessage('[1] LOG:  database system is ready to accept connections'))
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
            logging: false
        });
        setToken('');
    });

    beforeEach(async () => {
        await sequelize.sync({ force: true });
        users = await createUsers();
        categories = await createCategories();
    });

    it('should get all categories', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await categoryApi.getCategories().catch(processError);
        expect(res).has.lengthOf(Object.keys(categories).length);
        expect(res).to.eql(
            Object.keys(categories).map((k) => {
                return {
                    id: categories[k].id,
                    name: categories[k].name
                };
            })
        );
    });

    it('should try get all categories and fail authentication', async () => {
        const res = await categoryApi.getCategories().catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: ''
        });
    });

    it('should get category by id', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await categoryApi.getCategory(categories.main.id).catch(processError);
        expect(res).to.eql({
            id: categories.main.id,
            name: categories.main.name,
            createdAt: categories.main.createdAt.toISOString(),
            updatedAt: categories.main.updatedAt.toISOString()
        });
    });

    it('should try get category by id and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await categoryApi.getCategory(categories.main.id).catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: ''
        });
    });

    it('should try get category by id and fail on category not exists', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await categoryApi.getCategory(9999999).catch(processError);
        expect(res).to.eql({
            statusCode: 404,
            code: 'NOT_FOUND',
            message: ''
        });
    });

    it('should create category', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await categoryApi
            .createCategory({
                name: 'NewCategory'
            })
            .catch(processError);
        expect(res.id).to.be.a('number');
        expect(res.name).to.equal('NewCategory');
        expect(res.createdAt).to.be.a('string');
        expect(res.updatedAt).to.be.a('string');
    });

    it('should try create category and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await categoryApi
            .createCategory({
                name: 'NewCategory'
            })
            .catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: ''
        });
    });

    it('should try create category and fail on duplicity', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await categoryApi
            .createCategory({
                name: 'Main'
            })
            .catch(processError);
        expect(res).to.eql({
            code: 'UNIQUE_CONSTRAINT_ERROR',
            fields: {
                name: 'not_unique'
            },
            statusCode: 409
        });
    });

    it('should try create category and fail on validation', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await categoryApi
            .createCategory({
                name: 'AbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghij1'
            })
            .catch(processError);

        expect(res).to.eql({
            message: '',
            code: 'VALIDATION_FAILED',
            fields: {
                name: {
                    key: 'maxLength',
                    values: {
                        max: 50
                    }
                }
            },
            statusCode: 422
        });

        const res2 = await categoryApi
            .createCategory({
                name: ''
            })
            .catch(processError);
        expect(res2).to.eql({
            message: '',
            code: 'VALIDATION_FAILED',
            fields: { name: 'required' },
            statusCode: 422
        });
    });

    it('should update category', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await categoryApi
            .updateCategory(categories.main.id, {
                name: 'Main2'
            })
            .catch(processError);
        expect(res.id).to.equal(categories.main.id);
        expect(res.name).to.equal('Main2');
        expect(res.createdAt).to.be.a('string');
        expect(res.updatedAt).to.be.a('string');
    });

    it('should try update category and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await categoryApi
            .updateCategory(categories.main.id, {
                name: 'Main2'
            })
            .catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: ''
        });
    });

    it('should try update category and fail on duplicity', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await categoryApi
            .updateCategory(categories.main.id, {
                name: 'Side-dish'
            })
            .catch(processError);
        expect(res).to.eql({
            code: 'UNIQUE_CONSTRAINT_ERROR',
            fields: {
                name: 'not_unique'
            },
            statusCode: 409
        });
    });

    it('should try update category and fail on validation', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await categoryApi
            .updateCategory(categories.main.id, {
                name: 'AbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghij1'
            })
            .catch(processError);
        expect(res).to.eql({
            message: '',
            code: 'VALIDATION_FAILED',
            fields: {
                name: {
                    key: 'maxLength',
                    values: {
                        max: 50
                    }
                }
            },
            statusCode: 422
        });

        const res2 = await categoryApi
            .updateCategory(categories.main.id, {
                name: ''
            })
            .catch(processError);
        expect(res2).to.eql({
            message: '',
            code: 'VALIDATION_FAILED',
            fields: { name: 'required' },
            statusCode: 422
        });
    });

    it('should delete category', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);
        const res = await categoryApi.deleteCategory(categories.main.id).catch(processError);
        expect(res.status).to.equal(204);
    });

    it('should try delete category and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await categoryApi.deleteCategory(categories.main.id).catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: ''
        });
    });

    it('should try delete category and fail on category not exists', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await categoryApi.deleteCategory(9999999).catch(processError);
        expect(res).to.eql({
            statusCode: 404,
            code: 'NOT_FOUND',
            message: ''
        });
    });

    it('should try to delete category and fail on constraints', async () => {
        // prepare recipes mock data with constraint to meat tag
        const unitCategories = await createUnitCategories();
        const units = await createUnits(unitCategories);
        const tags = await createTags();
        await createRecipes(tags, units, categories, users);

        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await categoryApi.deleteCategory(categories.main.id).catch(processError);
        expect(res).to.eql({
            statusCode: 409,
            code: 'CONSTRAINT_FAILED'
        });
    });

    it('should try delete category and fail on authentication', async () => {
        // login and save token
        const res = await categoryApi.deleteCategory(categories.main.id).catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: ''
        });
    });
});
