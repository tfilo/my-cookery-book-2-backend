import { Server } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { Wait } from 'testcontainers';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import MailDev from 'maildev';

dotenv.config({ path: path.join('src', 'tests', '.env') });

import { app } from '../../app';
import sequelize from '../../util/database';
import { AuthApi, Configuration } from '../openapi';
import { use, expect } from 'chai';
import chaiExclude from 'chai-exclude';
import createUsers from '../data/user-data';
import User from '../../models/database/user';
import { issueRefreshToken, issueToken } from '../../util/token';
import { processError } from '../util/error';

use(chaiExclude);

type Email = {
    subject: string;
    from: string;
    to: string;
    text: string;
    html: string;
};

const port = process.env.PORT || 13000;

let token: string = '';
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

describe('Auth', () => {
    let users: { [key: string]: User };
    let serverInstance: Server;
    let databaseContainer: StartedPostgreSqlContainer;
    const authApi = new AuthApi(config);

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
    });

    it('should login', async () => {
        const res = await authApi
            .login({
                username: 'admin',
                password: 'Admin123'
            })
            .catch(processError);

        expect(res.token).to.be.a('string');
        expect(res.refreshToken).to.be.a('string');
    });

    it('should try to login and fail', async () => {
        const res = await authApi
            .login({
                username: 'admin',
                password: 'admin123'
            })
            .catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: ''
        });
    });

    it('should try to login and fail because user not confirmed', async () => {
        const res = await authApi
            .login({
                username: 'creator2',
                password: 'Creator2123'
            })
            .catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: ''
        });
    });

    it('should try to login and success after confirmation', async () => {
        const res1 = await authApi
            .confirmEmail({
                username: 'creator2',
                key: '511f1466-02b4-4605-af0f-eaf33afc8dd0'
            })
            .catch(processError);
        expect(res1.status).to.equal(204);

        const res2 = await authApi
            .login({
                username: 'creator2',
                password: 'Creator2123'
            })
            .catch(processError);
        expect(res2.token).to.be.a('string');
        expect(res2.refreshToken).to.be.a('string');
    });

    it('should refresh', async () => {
        const refreshToken = issueRefreshToken(users.admin);

        const refreshed = await authApi
            .refreshToken({
                refreshToken: refreshToken
            })
            .catch(processError);

        expect(refreshed.token).to.be.a('string');
        expect(refreshed.refreshToken).to.be.a('string');
    });

    it('should get authenticated user', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await authApi.user().catch(processError);
        expect(res).to.eql({
            username: 'admin',
            firstName: 'Best',
            lastName: 'Admin'
        });
    });

    it('should try get authenticated user without token', async () => {
        const res = await authApi.user().catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: ''
        });
    });

    it('should sent reset link, and try it to reset password, than confirm by successful login', async () => {
        const maildev = new MailDev({
            smtp: Number(process.env.EMAIL_PORT),
            disableWeb: true,
            silent: true
        });
        let uuid: string;
        try {
            maildev.listen();

            const receivedEmailPromise = new Promise((resolve) => {
                maildev.on('new', resolve);
            });
            const res = await authApi
                .resetPasswordLink({
                    email: 'admin@test.test'
                })
                .catch(processError);

            expect(res.status).to.equal(204);

            const receivedEmail = (await receivedEmailPromise) as Email;

            expect(receivedEmail.subject).to.equal('My Cookery Book 2: Password reset');
            expect(receivedEmail.from).to.eql([
                {
                    address: process.env.EMAIL_FROM,
                    name: ''
                }
            ]);
            expect(receivedEmail.to).to.eql([
                {
                    address: 'admin@test.test',
                    name: ''
                }
            ]);
            expect(receivedEmail.text).to.be.a('string');
            expect(receivedEmail.html).to.be.a('string');
            expect(receivedEmail.text).to.equal(receivedEmail.html); // in tests template both are same so result should be same too

            const fullName = receivedEmail.text.split(',')[0];
            expect(fullName).to.equal('Best Admin');
            uuid = receivedEmail.text.split(',')[1];
        } finally {
            maildev.close();
        }

        const res1 = await authApi
            .resetPassword({
                username: 'admin',
                key: uuid,
                newPassword: 'N3wPassw0rd'
            })
            .catch(processError);
        expect(res1.status).to.equal(204);

        const res2 = await authApi
            .login({
                username: 'admin',
                password: 'N3wPassw0rd'
            })
            .catch(processError);

        expect(res2.token).to.be.a('string');
        expect(res2.refreshToken).to.be.a('string');
    });
});
