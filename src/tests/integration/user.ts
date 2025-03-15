import { Server } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { Wait } from 'testcontainers';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import MailDev from 'maildev';

dotenv.config({ path: path.join('src', 'tests', '.env') });

import { app } from '../../app';
import sequelize from '../../util/database';
import { Api, Configuration, UserApi } from '../openapi';
import { use, expect } from 'chai';
import chaiExclude from 'chai-exclude';
import createUsers from '../data/user-data';
import User from '../../models/database/user';
import { issueToken } from '../../util/token';
import { processError } from '../util/error';

use(chaiExclude);

const port = process.env.PORT || 13000;

type Email = {
    subject: string;
    from: string;
    to: string;
    text: string;
    html: string;
};

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

describe('User', () => {
    let users: { [key: string]: User };
    let serverInstance: Server;
    let databaseContainer: StartedPostgreSqlContainer;
    const userApi = new UserApi(config);

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
                    confirmed: users[k].confirmed,
                    notifications: users[k].notifications,
                    roles: users[k].roles.map((r) => r.roleName)
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
            message: ''
        });
    });

    it('should try get all users and fail on authentication', async () => {
        // login and save token
        const res = await userApi.getUsers().catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: ''
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
            email: users.creator.email,
            confirmed: users.creator.confirmed,
            notifications: users.creator.notifications,
            roles: users.creator.roles.map((r) => r.roleName),
            createdAt: users.creator.createdAt.toISOString(),
            updatedAt: users.creator.updatedAt.toISOString()
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
            message: ''
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
            message: ''
        });
    });

    it('should create user', async () => {
        const maildev = new MailDev({
            smtp: Number(process.env.EMAIL_PORT),
            disableWeb: true,
            silent: true
        });
        let receivedEmail: Email;
        try {
            maildev.listen();
            const receivedEmailPromise = new Promise((resolve) => {
                maildev.on('new', (email) => {
                    resolve(email);
                });
            });
            // prepare valid token
            const token = issueToken(users.admin);
            setToken(token);

            const res = await userApi
                .createUser({
                    username: 'newuser',
                    password: 'NewUser1',
                    firstName: 'New',
                    lastName: 'User',
                    email: 'newuser@test.test',
                    roles: [Api.CreateUser.RoleEnum.CREATOR],
                    notifications: false
                })
                .catch(processError);

            expect(res.id).to.be.a('number');
            expect(res.username).to.equal('newuser');
            expect(res.firstName).to.equal('New');
            expect(res.lastName).to.equal('User');
            expect(res.confirmed).to.equal(false);
            expect(res.notifications).to.equal(false);
            expect(res.email).to.equal('newuser@test.test');
            expect(res.roles).to.eql([Api.CreateUser.RoleEnum.CREATOR]);
            expect(res.createdAt).to.be.a('string');
            expect(res.updatedAt).to.be.a('string');
            receivedEmail = (await receivedEmailPromise) as Email;
        } finally {
            maildev.close();
        }

        expect(receivedEmail.subject).to.equal('My Cookery Book 2: Email confirmation');
        expect(receivedEmail.from).to.eql([
            {
                address: process.env.EMAIL_FROM,
                name: ''
            }
        ]);
        expect(receivedEmail.to).to.eql([
            {
                address: 'newuser@test.test',
                name: ''
            }
        ]);
        expect(receivedEmail.text).to.be.a('string');
        expect(receivedEmail.html).to.be.a('string');
        expect(receivedEmail.text).to.equal(receivedEmail.html); // in tests template both are same so result should be same too
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
                email: 'newuser@test.test',
                roles: [Api.CreateUser.RoleEnum.CREATOR],
                notifications: false
            })
            .catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: ''
        });
    });

    it('should try create user and fail on duplicity', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res1 = await userApi
            .createUser({
                username: 'creator',
                password: 'NewUser1',
                firstName: 'New',
                lastName: 'User',
                email: 'creatorX@test.test',
                roles: [Api.CreateUser.RoleEnum.CREATOR],
                notifications: false
            })
            .catch(processError);
        expect(res1).to.eql({
            code: 'UNIQUE_CONSTRAINT_ERROR',
            fields: {
                username: 'not_unique'
            },
            statusCode: 409
        });

        const res2 = await userApi
            .createUser({
                username: 'creatorX',
                password: 'NewUser1',
                firstName: 'New',
                lastName: 'User',
                email: 'creator@test.test',
                roles: [Api.CreateUser.RoleEnum.CREATOR],
                notifications: false
            })
            .catch(processError);
        expect(res2).to.eql({
            code: 'UNIQUE_CONSTRAINT_ERROR',
            fields: {
                email: 'not_unique'
            },
            statusCode: 409
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
                firstName: 'abcdefghijabcdefghijabcdefghijabcdefghijabcdefghij1',
                lastName: 'abcdefghijabcdefghijabcdefghijabcdefghijabcdefghij1',
                email: 'fdgsdfgdfgdf',
                roles: [],
                //@ts-expect-error intentional wrong type
                notifications: 'dasdads'
            })
            .catch(processError);

        expect(res).to.eql({
            message: '',
            code: 'VALIDATION_FAILED',
            fields: {
                username: {
                    key: 'maxLength',
                    values: {
                        max: 50
                    }
                },
                password: 'simplePassword',
                firstName: {
                    key: 'maxLength',
                    values: {
                        max: 50
                    }
                },
                lastName: {
                    key: 'maxLength',
                    values: {
                        max: 50
                    }
                },
                email: 'email',
                notifications: 'invalidValue'
            },
            statusCode: 422
        });

        const res2 = await userApi
            .createUser({
                username: '',
                password: '',
                firstName: '',
                lastName: '',
                email: '',
                roles: [],
                //@ts-expect-error intentional wrong type
                notifications: null
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
                        min: 3
                    }
                },
                lastName: {
                    key: 'minLength',
                    values: {
                        min: 3
                    }
                },
                email: 'required',
                notifications: 'required'
            },
            statusCode: 422
        });
    });

    it('should update user', async () => {
        const maildev = new MailDev({
            smtp: Number(process.env.EMAIL_PORT),
            disableWeb: true,
            silent: true
        });
        let receivedEmail: Email;
        try {
            maildev.listen();
            const receivedEmailPromise = new Promise((resolve) => {
                maildev.on('new', (email) => {
                    resolve(email);
                });
            });
            // prepare valid token
            const token = issueToken(users.admin);
            setToken(token);

            const res = await userApi
                .updateUser(users.creator.id, {
                    username: 'creator3',
                    password: null,
                    firstName: null,
                    lastName: null,
                    email: 'creator3@test.test',
                    notifications: false,
                    roles: []
                })
                .catch(processError);
            expect(res.id).to.equal(users.creator.id);
            expect(res.username).to.equal('creator3');
            expect(res.firstName).to.equal(null);
            expect(res.lastName).to.be.equal(null);
            expect(res.email).to.equal('creator3@test.test');
            expect(res.confirmed).to.equal(false);
            expect(res.notifications).to.equal(false);
            expect(res.roles).to.eql([]);
            expect(res.createdAt).to.be.a('string');
            expect(res.updatedAt).to.be.a('string');
            receivedEmail = (await receivedEmailPromise) as Email;
        } finally {
            maildev.close();
        }

        expect(receivedEmail.subject).to.equal('My Cookery Book 2: Email confirmation');
        expect(receivedEmail.from).to.eql([
            {
                address: process.env.EMAIL_FROM,
                name: ''
            }
        ]);
        expect(receivedEmail.to).to.eql([
            {
                address: 'creator3@test.test',
                name: ''
            }
        ]);
        expect(receivedEmail.text).to.be.a('string');
        expect(receivedEmail.html).to.be.a('string');
        expect(receivedEmail.text).to.equal(receivedEmail.html); // in tests template both are same so result should be same too
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
                email: 'creator3@test.test',
                notifications: false,
                roles: []
            })
            .catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: ''
        });
    });

    it('should try update user and fail on duplicity', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res1 = await userApi
            .updateUser(users.creator.id, {
                username: 'simple',
                password: null,
                firstName: null,
                lastName: null,
                email: 'simpleX@test.test',
                notifications: false,
                roles: []
            })
            .catch(processError);
        expect(res1).to.eql({
            code: 'UNIQUE_CONSTRAINT_ERROR',
            fields: {
                username: 'not_unique'
            },
            statusCode: 409
        });

        const res2 = await userApi
            .updateUser(users.creator.id, {
                username: 'simpleX',
                password: null,
                firstName: null,
                lastName: null,
                email: 'simple@test.test',
                notifications: false,
                roles: []
            })
            .catch(processError);
        expect(res2).to.eql({
            code: 'UNIQUE_CONSTRAINT_ERROR',
            fields: {
                email: 'not_unique'
            },
            statusCode: 409
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
                firstName: 'abcdefghijabcdefghijabcdefghijabcdefghijabcdefghij1',
                lastName: 'abcdefghijabcdefghijabcdefghijabcdefghijabcdefghij1',
                email: 'abcdefghijabcdefghijabcdefghijabcdefghijabcdefghij1',
                notifications: false,
                roles: []
            })
            .catch(processError);

        expect(res).to.eql({
            message: '',
            code: 'VALIDATION_FAILED',
            fields: {
                username: {
                    key: 'maxLength',
                    values: {
                        max: 50
                    }
                },
                password: 'simplePassword',
                firstName: {
                    key: 'maxLength',
                    values: {
                        max: 50
                    }
                },
                lastName: {
                    key: 'maxLength',
                    values: {
                        max: 50
                    }
                },
                email: 'email'
            },
            statusCode: 422
        });

        const res2 = await userApi
            .updateUser(users.creator.id, {
                username: '',
                password: '',
                firstName: '',
                lastName: '',
                email: '',
                notifications: false,
                roles: []
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
                        min: 3
                    }
                },
                lastName: {
                    key: 'minLength',
                    values: {
                        min: 3
                    }
                },
                email: 'required'
            },
            statusCode: 422
        });
    });

    it('should delete user', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);
        const res = await userApi.deleteUser(users.creator.id).catch(processError);
        expect(res.status).to.equal(204);
    });

    it('should try delete user and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await userApi.deleteUser(users.creator.id).catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: ''
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
            message: ''
        });
    });

    it('should try delete user and fail on authentication', async () => {
        // login and save token
        const res = await userApi.deleteUser(users.creator.id).catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: ''
        });
    });

    it('should try resend confirmation email and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.simple);
        setToken(token);

        const res = await userApi.resendConfirmation(users.creator.id).catch(processError);

        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: ''
        });
    });

    it('should try resend confirmation email to user with already confirmed email and fail because it is confirmed', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);
        const res = await userApi.resendConfirmation(users.creator.id).catch(processError);

        expect(res).to.eql({
            statusCode: 409,
            code: 'CONSTRAINT_FAILED',
            message: 'Already confirmed'
        });
    });

    it('should resend confirmation email to user', async () => {
        const maildev = new MailDev({
            smtp: Number(process.env.EMAIL_PORT),
            disableWeb: true,
            silent: true
        });
        let receivedEmail: Email;
        try {
            maildev.listen();
            const receivedEmailPromise = new Promise((resolve) => {
                maildev.on('new', (email) => {
                    resolve(email);
                });
            });
            // prepare valid token
            const token = issueToken(users.admin);
            setToken(token);

            const res = await userApi.resendConfirmation(users.creator2.id).catch(processError);

            expect(res.status).to.be.equal(204);
            receivedEmail = (await receivedEmailPromise) as Email;
        } finally {
            maildev.close();
        }

        expect(receivedEmail.subject).to.equal('My Cookery Book 2: Email confirmation');
        expect(receivedEmail.from).to.eql([
            {
                address: process.env.EMAIL_FROM,
                name: ''
            }
        ]);
        expect(receivedEmail.to).to.eql([
            {
                address: users.creator2.email,
                name: ''
            }
        ]);
        expect(receivedEmail.text).to.be.a('string');
        expect(receivedEmail.html).to.be.a('string');
        expect(receivedEmail.text).to.equal(receivedEmail.html); // in tests template both are same so result should be same too
    });

    it('should change user profile including password', async () => {
        const maildev = new MailDev({
            smtp: Number(process.env.EMAIL_PORT),
            disableWeb: true,
            silent: true
        });
        let receivedEmail: Email;
        try {
            maildev.listen();
            const receivedEmailPromise = new Promise((resolve) => {
                maildev.on('new', (email) => {
                    resolve(email);
                });
            });
            // prepare valid token
            const token = issueToken(users.admin);
            setToken(token);

            const updated = await userApi
                .updateProfile({
                    password: 'Admin123',
                    newPassword: 'Admin1234',
                    email: 'testX@test.test',
                    firstName: 'AAAA',
                    lastName: 'BBBB',
                    notifications: false
                })
                .catch(processError);
            expect(updated.status).to.equal(204);
            receivedEmail = (await receivedEmailPromise) as Email;
        } finally {
            maildev.close();
        }

        expect(receivedEmail.subject).to.equal('My Cookery Book 2: Email confirmation');
        expect(receivedEmail.from).to.eql([
            {
                address: process.env.EMAIL_FROM,
                name: ''
            }
        ]);
        expect(receivedEmail.to).to.eql([
            {
                address: 'testX@test.test',
                name: ''
            }
        ]);
        expect(receivedEmail.text).to.be.a('string');
        expect(receivedEmail.html).to.be.a('string');
        expect(receivedEmail.text).to.equal(receivedEmail.html); // in tests template both are same so result should be same too
    });

    it('should try to change password and fail', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res1 = await userApi
            .updateProfile({
                password: 'Admin123',
                newPassword: 'admin1234',
                email: 'test@test.test',
                firstName: 'AAAA',
                lastName: 'BBBB',
                notifications: false
            })
            .catch(processError);
        expect(res1).to.eql({
            statusCode: 422,
            message: '',
            code: 'VALIDATION_FAILED',
            fields: { newPassword: 'simplePassword' }
        });

        const res2 = await userApi
            .updateProfile({
                password: 'Admin123',
                newPassword: 'Adminadmin',
                email: 'test@test.test',
                firstName: 'AAAA',
                lastName: 'BBBB',
                notifications: false
            })
            .catch(processError);
        expect(res2).to.eql({
            statusCode: 422,
            message: '',
            code: 'VALIDATION_FAILED',
            fields: { newPassword: 'simplePassword' }
        });

        const res3 = await userApi
            .updateProfile({
                password: 'Admin123',
                newPassword: 'Admin1',
                email: 'test@test.test',
                firstName: 'AAAA',
                lastName: 'BBBB',
                notifications: false
            })
            .catch(processError);
        expect(res3).to.eql({
            statusCode: 422,
            message: '',
            code: 'VALIDATION_FAILED',
            fields: { newPassword: 'simplePassword' }
        });

        const res4 = await userApi
            .updateProfile({
                password: 'Admin123',
                newPassword: 'aaaaaaa',
                email: 'test@test.test',
                firstName: 'AAAA',
                lastName: 'BBBB',
                notifications: false
            })
            .catch(processError);
        expect(res4).to.eql({
            statusCode: 422,
            message: '',
            code: 'VALIDATION_FAILED',
            fields: { newPassword: 'simplePassword' }
        });
    });
});
