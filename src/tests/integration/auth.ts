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
import { issueRefreshToken, issueToken } from '../../util/token';
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

describe('Auth', () => {
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

    it('should login', async () => {
        const res = await authApi
            .login({
                username: 'admin',
                password: 'Admin123',
            })
            .catch(processError);

        expect(res.token).to.be.a('string');
        expect(res.refreshToken).to.be.a('string');
    });

    it('should try to login and fail', async () => {
        const res = await authApi
            .login({
                username: 'admin',
                password: 'admin123',
            })
            .catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: '',
        });
    });

    it('should refresh', async () => {
        const refreshToken = issueRefreshToken(users.admin);

        const refreshed = await authApi
            .refreshToken({
                refreshToken: refreshToken,
            })
            .catch(processError);

        expect(refreshed.token).to.be.a('string');
        expect(refreshed.refreshToken).to.be.a('string');
    });

    it('should change password', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const updated = await authApi
            .updatePassword({
                password: 'Admin123',
                newPassword: 'Admin1234',
            })
            .catch(processError);
        expect(updated.status).to.equals(204);

        // verify new password
        const res = await authApi
            .login({
                username: 'admin',
                password: 'Admin1234',
            })
            .catch(processError);
        expect(res.token).to.be.a('string');
        expect(res.refreshToken).to.be.a('string');
    });

    it('should try to change password and fail', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res1 = await authApi
            .updatePassword({
                password: 'Admin123',
                newPassword: 'admin1234',
            })
            .catch(processError);
        expect(res1).to.eql({
            statusCode: 422,
            message: '',
            code: 'VALIDATION_FAILED',
            fields: { newPassword: 'simplePassword' },
        });

        const res2 = await authApi
            .updatePassword({
                password: 'Admin123',
                newPassword: 'Adminadmin',
            })
            .catch(processError);
        expect(res2).to.eql({
            statusCode: 422,
            message: '',
            code: 'VALIDATION_FAILED',
            fields: { newPassword: 'simplePassword' },
        });

        const res3 = await authApi
            .updatePassword({
                password: 'Admin123',
                newPassword: 'Admin1',
            })
            .catch(processError);
        expect(res3).to.eql({
            statusCode: 422,
            message: '',
            code: 'VALIDATION_FAILED',
            fields: { newPassword: 'simplePassword' },
        });

        const res4 = await authApi
            .updatePassword({
                password: 'Admin123',
                newPassword: 'aaaaaaa',
            })
            .catch(processError);
        expect(res4).to.eql({
            statusCode: 422,
            message: '',
            code: 'VALIDATION_FAILED',
            fields: { newPassword: 'simplePassword' },
        });
    });

    it('should get authenticated user', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await authApi.user().catch(processError);
        expect(res).to.eql({
            username: 'admin',
            firstName: 'Best',
            lastName: 'Admin',
        });
    });

    it('should try get authenticated user without token', async () => {
        const res = await authApi.user().catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: '',
        });
    });
});
