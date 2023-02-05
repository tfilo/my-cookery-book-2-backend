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
        try {
            const res = await authApi.login({
                username: 'admin',
                password: 'Admin123',
            });

            expect(res.token).to.be.a('string');
            expect(res.refreshToken).to.be.a('string');
        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try to login and fail', async () => {
        try {
            const res = await authApi
                .login({
                    username: 'admin',
                    password: 'admin123',
                })
                .catch(async (err: any) => {
                    expect(err.status).to.equal(401);
                    if ('json' in err) {
                        return await err.json();
                    }
                    return err;
                });
            expect(res.code).to.equal('INVALID_CREDENTIALS');
            expect(res.message).to.equal('');
        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should refresh', async () => {
        try {
            const res = await authApi.login({
                username: 'admin',
                password: 'Admin123',
            });

            expect(res.token).to.be.a('string');
            expect(res.refreshToken).to.be.a('string');

            const refreshed = await authApi.refreshToken({
                refreshToken: res.refreshToken,
            });

            expect(refreshed.token).to.be.a('string');
            expect(refreshed.refreshToken).to.be.a('string');
        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should change password', async () => {
        try {
            // login and save token
            const res = await authApi.login({
                username: 'admin',
                password: 'Admin123',
            });
            setToken(res.token);

            const updated = await authApi.updatePassword({
                password: 'Admin123',
                newPassword: 'Admin1234',
            });
            expect(updated.status).to.equals(204);

            // verify new password
            const res2 = await authApi.login({
                username: 'admin',
                password: 'Admin1234',
            });
            expect(res2.token).to.be.a('string');
            expect(res2.refreshToken).to.be.a('string');
        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try to change password and fail', async () => {
        try {
            // login and save token
            const res = await authApi.login({
                username: 'admin',
                password: 'Admin123',
            });
            setToken(res.token);

            const res1 = await authApi
                .updatePassword({
                    password: 'Admin123',
                    newPassword: 'admin1234',
                })
                .catch(async (err: any) => {
                    expect(err.status).to.equal(422);
                    if ('json' in err) {
                        return await err.json();
                    }
                    return err;
                });
            expect(res1.code).to.equal('VALIDATION_FAILED');
            expect(res1.fields).to.eql({ newPassword: 'simplePassword' });

            const res2 = await authApi
                .updatePassword({
                    password: 'Admin123',
                    newPassword: 'Adminadmin',
                })
                .catch(async (err: any) => {
                    expect(err.status).to.equal(422);
                    if ('json' in err) {
                        return await err.json();
                    }
                    return err;
                });
            expect(res2.code).to.equal('VALIDATION_FAILED');
            expect(res2.fields).to.eql({
                newPassword: 'simplePassword',
            });

            const res3 = await authApi
                .updatePassword({
                    password: 'Admin123',
                    newPassword: 'Admin1',
                })
                .catch(async (err: any) => {
                    expect(err.status).to.equal(422);
                    if ('json' in err) {
                        return await err.json();
                    }
                    return err;
                });
            expect(res3.code).to.equal('VALIDATION_FAILED');
            expect(res3.fields).to.eql({
                newPassword: 'simplePassword',
            });

            const res4 = await authApi
                .updatePassword({
                    password: 'Admin123',
                    newPassword: 'aaaaaaa',
                })
                .catch(async (err: any) => {
                    expect(err.status).to.equal(422);
                    if ('json' in err) {
                        return await err.json();
                    }
                    return err;
                });
            expect(res4.code).to.equal('VALIDATION_FAILED');
            expect(res4.fields).to.eql({
                newPassword: 'simplePassword',
            });
        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should get authenticated user', async () => {
        try {
            // login and save token
            const res = await authApi.login({
                username: 'admin',
                password: 'Admin123',
            });
            setToken(res.token);

            const res2 = await authApi.user();
            expect(res2).to.eql({
                username: 'admin',
                firstName: 'Best',
                lastName: 'Admin',
            });
        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try get authenticated user without token', async () => {
        try {
            const res = await authApi.user().catch(async (err: any) => {
                expect(err.status).to.equal(401);
                if ('json' in err) {
                    return await err.json();
                }
                return err;
            });
            expect(res.code).to.equal('INVALID_CREDENTIALS');
            expect(res.message).to.equal('');
        } catch (err) {
            expect.fail('should never fail');
        }
    });
});
