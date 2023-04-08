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
import { Api, Configuration, UserApi } from '../openapi';
import Chai from 'chai';
import chaiExclude from 'chai-exclude';
import createUsers from '../data/user-data';
import User from '../../models/database/user';
import { issueToken } from '../../util/token';
import { processError } from '../util/error';

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

describe('User', () => {
    let users: { [key: string]: User };
    let serverInstance: Server;
    let databaseContainer: StartedPostgreSqlContainer;
    const userApi = new UserApi(config);

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

    it('should get all users', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await userApi.getUsers().catch(processError);
        expect(res).has.lengthOf(Object.keys(users).length);
        expect(res).to.eql(
            Object.keys(users).map((k) => {
                return {
                    id: users[k].id,
                    username: users[k].username,
                    firstName: users[k].firstName,
                    lastName: users[k].lastName,
                    roles: users[k].roles.map((r) => r.roleName),
                };
            })
        );
    });

    it('should try get all users and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await userApi.getUsers().catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: '',
        });
    });

    it('should try get all users and fail on authentication', async () => {
        // login and save token
        const res = await userApi.getUsers().catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: '',
        });
    });

    it('should get user by id', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await userApi.getUser(users.creator.id).catch(processError);
        expect(res).to.eql({
            id: users.creator.id,
            username: users.creator.username,
            firstName: users.creator.firstName,
            lastName: users.creator.lastName,
            roles: users.creator.roles.map((r) => r.roleName),
            createdAt: users.creator.createdAt.toISOString(),
            updatedAt: users.creator.updatedAt.toISOString(),
        });
    });

    it('should try get user by id and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await userApi.getUser(users.creator.id).catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: '',
        });
    });

    it('should try get user by id and fail on user not exists', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await userApi.getUser(9999999).catch(processError);
        expect(res).to.eql({
            statusCode: 404,
            code: 'NOT_FOUND',
            message: '',
        });
    });

    it('should create user', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await userApi
            .createUser({
                username: 'newuser',
                password: 'NewUser1',
                firstName: 'New',
                lastName: 'User',
                roles: [Api.CreateUser.RolesEnum.CREATOR],
            })
            .catch(processError);

        expect(res.id).to.be.a('number');
        expect(res.username).to.equal('newuser');
        expect(res.firstName).to.equal('New');
        expect(res.lastName).to.equal('User');
        expect(res.roles).to.eql([Api.CreateUser.RolesEnum.CREATOR]);
        expect(res.createdAt).to.be.a('string');
        expect(res.updatedAt).to.be.a('string');
    });

    it('should try create user and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await userApi
            .createUser({
                username: 'newuser',
                password: 'NewUser1',
                firstName: 'New',
                lastName: 'User',
                roles: [Api.CreateUser.RolesEnum.CREATOR],
            })
            .catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: '',
        });
    });

    it('should try create user and fail on duplicity', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await userApi
            .createUser({
                username: 'creator',
                password: 'NewUser1',
                firstName: 'New',
                lastName: 'User',
                roles: [Api.CreateUser.RolesEnum.CREATOR],
            })
            .catch(processError);
        expect(res).to.eql({
            code: 'UNIQUE_CONSTRAINT_ERROR',
            fields: {
                username: 'not_unique',
            },
            statusCode: 409,
        });
    });

    it('should try create user and fail on validation', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await userApi
            .createUser({
                username: 'abcdefghijabcdefghijabcdefghijabcdefghijabcdefghij1',
                password: 'NewUser',
                firstName:
                    'abcdefghijabcdefghijabcdefghijabcdefghijabcdefghij1',
                lastName: 'abcdefghijabcdefghijabcdefghijabcdefghijabcdefghij1',
                roles: [],
            })
            .catch(processError);

        expect(res).to.eql({
            message: '',
            code: 'VALIDATION_FAILED',
            fields: {
                username: {
                    key: 'maxLength',
                    values: {
                        max: 50,
                    },
                },
                password: 'simplePassword',
                firstName: {
                    key: 'maxLength',
                    values: {
                        max: 50,
                    },
                },
                lastName: {
                    key: 'maxLength',
                    values: {
                        max: 50,
                    },
                },
            },
            statusCode: 422,
        });

        const res2 = await userApi
            .createUser({
                username: '',
                password: '',
                firstName: '',
                lastName: '',
                roles: [],
            })
            .catch(processError);
        expect(res2).to.eql({
            message: '',
            code: 'VALIDATION_FAILED',
            fields: {
                username: 'required',
                password: 'required',
                firstName: {
                    key: 'minLength',
                    values: {
                        min: 3,
                    },
                },
                lastName: {
                    key: 'minLength',
                    values: {
                        min: 3,
                    },
                },
            },
            statusCode: 422,
        });
    });

    it('should update user', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await userApi
            .updateUser(users.creator.id, {
                username: 'creator3',
                password: null,
                firstName: null,
                lastName: null,
                roles: [],
            })
            .catch(processError);
        expect(res.id).to.equal(users.creator.id);
        expect(res.username).to.equal('creator3');
        expect(res.firstName).to.be.null;
        expect(res.lastName).to.be.null;
        expect(res.roles).to.eql([]);
        expect(res.createdAt).to.be.a('string');
        expect(res.updatedAt).to.be.a('string');
    });

    it('should try update user and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await userApi
            .updateUser(users.creator.id, {
                username: 'creator3',
                password: null,
                firstName: null,
                lastName: null,
                roles: [],
            })
            .catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: '',
        });
    });

    it('should try update user and fail on duplicity', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await userApi
            .updateUser(users.creator.id, {
                username: 'simple',
                password: null,
                firstName: null,
                lastName: null,
                roles: [],
            })
            .catch(processError);
        expect(res).to.eql({
            code: 'UNIQUE_CONSTRAINT_ERROR',
            fields: {
                username: 'not_unique',
            },
            statusCode: 409,
        });
    });

    it('should try update user and fail on validation', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await userApi
            .updateUser(users.creator.id, {
                username: 'abcdefghijabcdefghijabcdefghijabcdefghijabcdefghij1',
                password: 'NewUser',
                firstName:
                    'abcdefghijabcdefghijabcdefghijabcdefghijabcdefghij1',
                lastName: 'abcdefghijabcdefghijabcdefghijabcdefghijabcdefghij1',
                roles: [],
            })
            .catch(processError);

        expect(res).to.eql({
            message: '',
            code: 'VALIDATION_FAILED',
            fields: {
                username: {
                    key: 'maxLength',
                    values: {
                        max: 50,
                    },
                },
                password: 'simplePassword',
                firstName: {
                    key: 'maxLength',
                    values: {
                        max: 50,
                    },
                },
                lastName: {
                    key: 'maxLength',
                    values: {
                        max: 50,
                    },
                },
            },
            statusCode: 422,
        });

        const res2 = await userApi
            .updateUser(users.creator.id, {
                username: '',
                password: '',
                firstName: '',
                lastName: '',
                roles: [],
            })
            .catch(processError);
        expect(res2).to.eql({
            message: '',
            code: 'VALIDATION_FAILED',
            fields: {
                username: 'required',
                password: 'simplePassword',
                firstName: {
                    key: 'minLength',
                    values: {
                        min: 3,
                    },
                },
                lastName: {
                    key: 'minLength',
                    values: {
                        min: 3,
                    },
                },
            },
            statusCode: 422,
        });
    });

    it('should delete user', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);
        const res = await userApi.deleteUser(users.creator.id).catch(processError);
        expect(res.status).to.equals(204);
    });

    it('should try delete user and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await userApi.deleteUser(users.creator.id).catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: '',
        });
    });

    it('should try delete user and fail on user not exists', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await userApi.deleteUser(9999999).catch(processError);
        expect(res).to.eql({
            statusCode: 404,
            code: 'NOT_FOUND',
            message: '',
        });
    });

    it('should try delete user and fail on authentication', async () => {
        // login and save token
        const res = await userApi.deleteUser(users.creator.id).catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: '',
        });
    });
});
