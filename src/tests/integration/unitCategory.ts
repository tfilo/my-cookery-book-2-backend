import { Server } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { Wait } from 'testcontainers';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

dotenv.config({ path: path.join('src', 'tests', '.env') });

import { app } from '../../app';
import sequelize from '../../util/database';
import { Configuration, UnitCategoryApi } from '../openapi';
import { use, expect } from 'chai';
import chaiExclude from 'chai-exclude';
import createUsers from '../data/user-data';
import createUnits from '../data/unit-data';
import createCategories from '../data/category-data';
import createUnitCategories from '../data/unitCategory-data';
import createTags from '../data/tag-data';
import createRecipes from '../data/recipe-data';
import User from '../../models/database/user';
import UnitCategory from '../../models/database/unitCategory';
import { issueToken } from '../../util/token';
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

describe('Unit Category', () => {
    let users: { [key: string]: User };
    let unitCategories: { [key: string]: UnitCategory };
    let serverInstance: Server;
    let databaseContainer: StartedPostgreSqlContainer;
    const unitCategoryApi = new UnitCategoryApi(config);

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
        unitCategories = await createUnitCategories();
    });

    it('should get all unit categories', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await unitCategoryApi.getUnitCategories().catch(processError);
        expect(res).has.lengthOf(Object.keys(unitCategories).length);
        expect(res).to.eql(
            Object.keys(unitCategories).map((k) => {
                return {
                    id: unitCategories[k].id,
                    name: unitCategories[k].name
                };
            })
        );
    });

    it('should try get all unit categories and fail authentication', async () => {
        const res = await unitCategoryApi.getUnitCategories().catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: ''
        });
    });

    it('should get unit category by id', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await unitCategoryApi.getUnitCategory(unitCategories.length.id).catch(processError);
        expect(res).to.eql({
            id: unitCategories.length.id,
            name: unitCategories.length.name,
            createdAt: unitCategories.length.createdAt.toISOString(),
            updatedAt: unitCategories.length.updatedAt.toISOString()
        });
    });

    it('should try get unit category by id and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await unitCategoryApi.getUnitCategory(unitCategories.length.id).catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: ''
        });
    });

    it('should try get unit category by id and fail on unit category not exists', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await unitCategoryApi.getUnitCategory(9999999).catch(processError);
        expect(res).to.eql({
            statusCode: 404,
            code: 'NOT_FOUND',
            message: ''
        });
    });

    it('should create unit category', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await unitCategoryApi
            .createUnitCategory({
                name: 'NewUnitCategory'
            })
            .catch(processError);
        expect(res.id).to.be.a('number');
        expect(res.name).to.equal('NewUnitCategory');
        expect(res.createdAt).to.be.a('string');
        expect(res.updatedAt).to.be.a('string');
    });

    it('should try create unit category and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await unitCategoryApi
            .createUnitCategory({
                name: 'NewUnitCategory'
            })
            .catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: ''
        });
    });

    it('should try create unit category and fail on duplicity', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await unitCategoryApi
            .createUnitCategory({
                name: 'Length'
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

    it('should try create unit category and fail on validation', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await unitCategoryApi
            .createUnitCategory({
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
                        max: 80
                    }
                }
            },
            statusCode: 422
        });

        const res2 = await unitCategoryApi
            .createUnitCategory({
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

    it('should update unit category', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await unitCategoryApi
            .updateUnitCategory(unitCategories.length.id, {
                name: 'Length2'
            })
            .catch(processError);
        expect(res.id).to.equal(unitCategories.length.id);
        expect(res.name).to.equal('Length2');
        expect(res.createdAt).to.be.a('string');
        expect(res.updatedAt).to.be.a('string');
    });

    it('should try update unit category and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await unitCategoryApi
            .updateUnitCategory(unitCategories.length.id, {
                name: 'Length2'
            })
            .catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: ''
        });
    });

    it('should try update unit category and fail on duplicity', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await unitCategoryApi
            .updateUnitCategory(unitCategories.length.id, {
                name: 'Other'
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

    it('should try update unit category and fail on validation', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await unitCategoryApi
            .updateUnitCategory(unitCategories.length.id, {
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
                        max: 80
                    }
                }
            },
            statusCode: 422
        });

        const res2 = await unitCategoryApi
            .updateUnitCategory(unitCategories.length.id, {
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

    it('should delete unit category', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);
        const res = await unitCategoryApi.deleteUnitCategory(unitCategories.length.id).catch(processError);
        expect(res.status).to.equal(204);
    });

    it('should try delete unit category and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await unitCategoryApi.deleteUnitCategory(unitCategories.length.id).catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: ''
        });
    });

    it('should try delete unit category and fail on unit category not exists', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await unitCategoryApi.deleteUnitCategory(9999999).catch(processError);
        expect(res).to.eql({
            statusCode: 404,
            code: 'NOT_FOUND',
            message: ''
        });
    });

    it('should try to delete unit category and fail on constraints', async () => {
        // prepare recipes mock data with constraint to meat tag
        const units = await createUnits(unitCategories);
        const tags = await createTags();
        const categories = await createCategories();
        await createRecipes(tags, units, categories, users);

        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await unitCategoryApi.deleteUnitCategory(unitCategories.weight.id).catch(processError);
        expect(res).to.eql({
            statusCode: 409,
            code: 'CONSTRAINT_FAILED'
        });
    });

    it('should try delete unit category and fail on authentication', async () => {
        // login and save token
        const res = await unitCategoryApi.deleteUnitCategory(unitCategories.length.id).catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: ''
        });
    });
});
