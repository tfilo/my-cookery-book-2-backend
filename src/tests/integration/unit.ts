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
import { Configuration, UnitApi } from '../openapi';
import Chai from 'chai';
import chaiExclude from 'chai-exclude';
import createUsers from '../data/user-data';
import createUnitCategories from '../data/unitCategory-data';
import createUnits from '../data/unit-data';
import User from '../../models/database/user';
import UnitCategory from '../../models/database/unitCategory';
import Unit from '../../models/database/unit';
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

describe('Unit', () => {
    let users: { [key: string]: User };
    let unitCategories: { [key: string]: UnitCategory };
    let units: { [key: string]: Unit };
    let serverInstance: Server;
    let databaseContainer: StartedPostgreSqlContainer;
    const unitApi = new UnitApi(config);

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
        unitCategories = await createUnitCategories();
        units = await createUnits(unitCategories);
    });

    it('should get all units of category', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await unitApi
            .getUnitsByUnitCategory(unitCategories.length.id)
            .catch(processError);
        expect(res).has.lengthOf(
            Object.keys(units).filter(
                (k) => units[k].unitCategoryId === unitCategories.length.id
            ).length
        );
        expect(res).to.eql(
            Object.keys(units)
                .filter(
                    (k) => units[k].unitCategoryId === unitCategories.length.id
                )
                .map((k) => {
                    return {
                        id: units[k].id,
                        name: units[k].name,
                        abbreviation: units[k].abbreviation,
                        required: units[k].required,
                    };
                })
        );
    });

    it('should try get all units of category and fail authentication', async () => {
        const res = await unitApi
            .getUnitsByUnitCategory(unitCategories.length.id)
            .catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: '',
        });
    });

    it('should get all units of category and found none because unit category not exists', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await unitApi
            .getUnitsByUnitCategory(100000)
            .catch(processError);

        expect(res).to.eql([]);
    });

    it('should get unit by id', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await unitApi
            .getUnit(units.centimeter.id)
            .catch(processError);
        expect(res).to.eql({
            id: units.centimeter.id,
            name: units.centimeter.name,
            abbreviation: units.centimeter.abbreviation,
            required: units.centimeter.required,
            unitCategoryId: units.centimeter.unitCategoryId,
            createdAt: units.centimeter.createdAt.toISOString(),
            updatedAt: units.centimeter.updatedAt.toISOString(),
        });
    });

    it('should try get unit by id and fail on authentication', async () => {
        const res = await unitApi
            .getUnit(units.centimeter.id)
            .catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: '',
        });
    });

    it('should try get unit by id and fail on unit not exists', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await unitApi.getUnit(100000).catch(processError);
        expect(res).to.eql({
            statusCode: 404,
            code: 'NOT_FOUND',
            message: '',
        });
    });

    it('should create unit', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await unitApi
            .createUnit({
                name: 'NewUnit',
                abbreviation: 'NU',
                required: false,
                unitCategoryId: unitCategories.length.id,
            })
            .catch(processError);
        expect(res.id).to.be.a('number');
        expect(res.name).to.equal('NewUnit');
        expect(res.abbreviation).to.equal('NU');
        expect(res.required).to.equal(false);
        expect(res.unitCategoryId).to.equal(unitCategories.length.id);
        expect(res.createdAt).to.be.a('string');
        expect(res.updatedAt).to.be.a('string');
    });

    it('should try create unit and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await unitApi
            .createUnit({
                name: 'NewUnit',
                abbreviation: 'NU',
                required: false,
                unitCategoryId: unitCategories.length.id,
            })
            .catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: '',
        });
    });

    it('should try create unit and fail on duplicity', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res1 = await unitApi
            .createUnit({
                name: 'Centimeter',
                abbreviation: 'ccmm',
                required: false,
                unitCategoryId: unitCategories.length.id,
            })
            .catch(processError);
        expect(res1).to.eql({
            code: 'UNIQUE_CONSTRAINT_ERROR',
            fields: {
                name: 'not_unique',
            },
            statusCode: 409,
        });

        const res2 = await unitApi
            .createUnit({
                name: 'Centimeterrrr',
                abbreviation: 'cm',
                required: false,
                unitCategoryId: unitCategories.length.id,
            })
            .catch(processError);
        expect(res2).to.eql({
            code: 'UNIQUE_CONSTRAINT_ERROR',
            fields: {
                abbreviation: 'not_unique',
            },
            statusCode: 409,
        });
    });

    it('should try create unit and fail on validation', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await unitApi
            .createUnit({
                name: 'AbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghij1',
                abbreviation:
                    'AbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghij1',
                required: false,
                unitCategoryId: -50,
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
                abbreviation: {
                    key: 'maxLength',
                    values: {
                        max: 20,
                    },
                },
                unitCategoryId: {
                    key: 'min',
                    values: {
                        min: 1,
                    },
                },
            },
            statusCode: 422,
        });

        const res2 = await unitApi
            .createUnit({
                name: '',
                abbreviation: '',
                //@ts-ignore
                required: null,
                //@ts-ignore
                unitCategoryId: null,
            })
            .catch(processError);
        expect(res2).to.eql({
            message: '',
            code: 'VALIDATION_FAILED',
            fields: {
                name: 'required',
                abbreviation: 'required',
                required: 'invalidValue',
                unitCategoryId: 'invalidValue',
            },
            statusCode: 422,
        });
    });

    it('should update unit', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await unitApi
            .updateUnit(units.centimeter.id, {
                name: 'Centimeter2',
                abbreviation: 'cm2',
                required: false,
                unitCategoryId: unitCategories.weight.id,
            })
            .catch(processError);
        expect(res.id).to.equal(units.centimeter.id);
        expect(res.name).to.equal('Centimeter2');
        expect(res.abbreviation).to.equal('cm2');
        expect(res.required).to.equal(false);
        expect(res.unitCategoryId).to.equal(unitCategories.weight.id);
        expect(res.createdAt).to.be.a('string');
        expect(res.updatedAt).to.be.a('string');
    });

    it('should try update unit and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await unitApi
            .updateUnit(units.centimeter.id, {
                name: 'Centimeter2',
                abbreviation: 'cm2',
                required: false,
                unitCategoryId: unitCategories.weight.id,
            })
            .catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: '',
        });
    });

    it('should try update unit and fail on duplicity', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res1 = await unitApi
            .updateUnit(units.centimeter.id, {
                name: 'Meter',
                abbreviation: 'cm',
                required: false,
                unitCategoryId: unitCategories.length.id,
            })
            .catch(processError);
        expect(res1).to.eql({
            code: 'UNIQUE_CONSTRAINT_ERROR',
            fields: {
                name: 'not_unique',
            },
            statusCode: 409,
        });

        const res2 = await unitApi
            .updateUnit(units.centimeter.id, {
                name: 'Centimeter',
                abbreviation: 'm',
                required: false,
                unitCategoryId: unitCategories.length.id,
            })
            .catch(processError);
        expect(res2).to.eql({
            code: 'UNIQUE_CONSTRAINT_ERROR',
            fields: {
                abbreviation: 'not_unique',
            },
            statusCode: 409,
        });
    });

    it('should try update unit and fail on validation', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await unitApi
            .updateUnit(units.centimeter.id, {
                name: 'AbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghij1',
                abbreviation:
                    'AbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghijAbcdefghij1',
                required: false,
                unitCategoryId: -50,
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
                abbreviation: {
                    key: 'maxLength',
                    values: {
                        max: 20,
                    },
                },
                unitCategoryId: {
                    key: 'min',
                    values: {
                        min: 1,
                    },
                },
            },
            statusCode: 422,
        });

        const res2 = await unitApi
            .updateUnit(units.centimeter.id, {
                name: '',
                abbreviation: '',
                //@ts-ignore
                required: null,
                //@ts-ignore
                unitCategoryId: null,
            })
            .catch(processError);
        expect(res2).to.eql({
            message: '',
            code: 'VALIDATION_FAILED',
            fields: {
                name: 'required',
                abbreviation: 'required',
                required: 'invalidValue',
                unitCategoryId: 'invalidValue',
            },
            statusCode: 422,
        });
    });

    it('should delete unit', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);
        const res = await unitApi
            .deleteUnit(units.centimeter.id)
            .catch(processError);
        expect(res.status).to.equals(204);
    });

    it('should try delete unit and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await unitApi
            .deleteUnit(units.centimeter.id)
            .catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: '',
        });
    });

    it('should try delete unit and fail on unit not exists', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await unitApi
            .deleteUnit(9999999)
            .catch(processError);
        expect(res).to.eql({
            statusCode: 404,
            code: 'NOT_FOUND',
            message: '',
        });
    });

    it('should try delete unit and fail on authentication', async () => {
        // login and save token
        const res = await unitApi
            .deleteUnit(units.centimeter.id)
            .catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: '',
        });
    });
});
