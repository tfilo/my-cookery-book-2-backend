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
import { AuthApi, Configuration } from '../openapi';
import Chai from 'chai';
import chaiExclude from 'chai-exclude';
import createUsers from '../data/user-data';
import User from '../../models/database/user';

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

describe('Unit Category', () => {
    let users: { [key: string]: User };
    let serverInstance: Server;
    let databaseContainer: StartedPostgreSqlContainer;
    const authApi = new AuthApi(config);

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
    });

    /*
    it('should get all unit categories', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try get all unit categories and fail authentication', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should get unit category by id', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try get unit category by id and fail on roles', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try get unit category by id and fail on unit category not exists', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should create unit category', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try create unit category and fail on roles', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try create unit category and fail on duplicity', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try create unit category and fail on validation', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should update unit category', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try update unit category and fail on roles', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try update unit category and fail on duplicity', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try update unit category and fail on validation', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should delete unit category', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try delete unit category and fail on roles', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try delete unit category and fail on unit category not exists', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });
    */
});