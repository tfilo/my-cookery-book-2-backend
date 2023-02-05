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
import { AuthApi, Configuration, TagApi } from '../openapi';
import Chai from 'chai';
import chaiExclude from 'chai-exclude';
import createUsers from '../data/user-data';
import createTags from '../data/tag-data';
import User from '../../models/database/user';
import Tag from '../../models/database/tag';

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
    const authApi = new AuthApi(config);
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
        try {
            // login and save token
            const res1 = await authApi.login({
                username: 'admin',
                password: 'Admin123',
            });
            setToken(res1.token);

            const res2 = await tagApi.getTags();
            expect(res2).has.lengthOf(Object.keys(tags).length);
            expect(res2).to.eql(
                Object.keys(tags).map((k) => {
                    return {
                        id: tags[k].id,
                        name: tags[k].name,
                    };
                })
            );
        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try get all tags and fail authentication', async () => {
        try {
            // login and save token
            const res = await tagApi.getTags().catch(async (err: any) => {
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

    it('should get tag by id', async () => {
        try {
            // login and save token
            const res1 = await authApi.login({
                username: 'admin',
                password: 'Admin123',
            });
            setToken(res1.token);

            const res2 = await tagApi.getTag(tags.meat.id);
            expect(res2).to.eql({
                id: tags.meat.id,
                name: tags.meat.name,
                createdAt: tags.meat.createdAt.toISOString(),
                updatedAt: tags.meat.updatedAt.toISOString(),
            });
        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try get tag by id and fail on roles', async () => {
        try {
            // login and save token
            const res1 = await authApi.login({
                username: 'creator',
                password: 'Creator123',
            });
            setToken(res1.token);

            const res2 = await tagApi
                .getTag(tags.meat.id)
                .catch(async (err: any) => {
                    expect(err.status).to.equal(403);
                    if ('json' in err) {
                        return await err.json();
                    }
                    return err;
                });
            expect(res2.code).to.equal('FORBIDEN');
            expect(res2.message).to.equal('');
        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try get tag by id and fail on tag not exists', async () => {
        try {
            // login and save token
            const res1 = await authApi.login({
                username: 'admin',
                password: 'Admin123',
            });
            setToken(res1.token);

            const res = await tagApi.getTag(100000).catch(async (err: any) => {
                expect(err.status).to.equal(404);
                if ('json' in err) {
                    return await err.json();
                }
                return err;
            });
            expect(res.code).to.equal('NOT_FOUND');
            expect(res.message).to.equal('');
        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should create tag', async () => {
        try {
            // login and save token
            const res1 = await authApi.login({
                username: 'admin',
                password: 'Admin123',
            });
            setToken(res1.token);

            const res2 = await tagApi.createTag({
                name: 'NewTag',
            });
            expect(res2.id).to.be.a('number');
            expect(res2.name).to.equal('NewTag');
            expect(res2.createdAt).to.be.a('string');
            expect(res2.updatedAt).to.be.a('string');
        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try create tag and fail on roles', async () => {
        try {
            // login and save token
            const res1 = await authApi.login({
                username: 'creator',
                password: 'Creator123',
            });
            setToken(res1.token);

            const res2 = await tagApi
                .createTag({
                    name: 'NewTag',
                })
                .catch(async (err: any) => {
                    expect(err.status).to.equal(403);
                    if ('json' in err) {
                        return await err.json();
                    }
                    return err;
                });
            expect(res2.code).to.equal('FORBIDEN');
            expect(res2.message).to.equal('');
        } catch (err) {
            expect.fail('should never fail');
        }
    });
    /*
    it('should try create tag and fail on duplicity', async () => {
        try {
        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try create tag and fail on validation', async () => {
        try {
        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should update tag', async () => {
        try {
        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try update tag and fail on roles', async () => {
        try {
        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try update tag and fail on duplicity', async () => {
        try {
        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try update tag and fail on validation', async () => {
        try {
        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should delete tag', async () => {
        try {
        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try delete tag and fail on roles', async () => {
        try {
        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try delete tag and fail on tag not exists', async () => {
        try {
        } catch (err) {
            expect.fail('should never fail');
        }
    });
    */
});
