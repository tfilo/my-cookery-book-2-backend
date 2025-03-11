import { Server } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { Wait } from 'testcontainers';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import MailDev from 'maildev';

dotenv.config({ path: path.join('src', 'tests', '.env') });

import { appInternal } from '../../internal';
import sequelize from '../../util/database';
import { Configuration, NotificationsApi } from '../openapi-internal';
import { use, expect } from 'chai';
import chaiExclude from 'chai-exclude';
import createUsers from '../data/user-data';
import createCategories from '../data/category-data';
import createUnits from '../data/unit-data';
import createUnitCategories from '../data/unitCategory-data';
import createRecipes from '../data/recipe-data';
import createTags from '../data/tag-data';
import User from '../../models/database/user';
import Tag from '../../models/database/tag';
import UnitCategory from '../../models/database/unitCategory';
import Unit from '../../models/database/unit';
import Category from '../../models/database/category';
import Recipe from '../../models/database/recipe';
import { processError } from '../util/error';

use(chaiExclude);

type Email = {
    subject: string;
    from: string;
    to: string;
    text: string;
    html: string;
};

const port = process.env.PORT_INTERNAL || 13001;

const config = new Configuration({
    basePath: 'http://localhost:' + port + process.env.INTERNAL_PATH
});

describe('Notification', () => {
    let users: { [key: string]: User };
    let tags: { [key: string]: Tag };
    let unitCategories: { [key: string]: UnitCategory };
    let units: { [key: string]: Unit };
    let categories: { [key: string]: Category };
    let recipes: { [key: string]: Recipe };

    let serverInstance: Server;
    let databaseContainer: StartedPostgreSqlContainer;
    const notificationApi = new NotificationsApi(config);

    before(async () => {
        databaseContainer = await new PostgreSqlContainer('postgres:14.5-alpine')
            .withDatabase('cookery2')
            .withUsername('cookery2')
            .withPassword('cookery2123')
            .withExposedPorts({
                container: 5432,
                host: Number(process.env.DATABASE_PORT)
            })
            .withWaitStrategy(Wait.forLogMessage('[1] LOG:  database system is ready to accept connections'))
            .start();
        serverInstance = appInternal.listen(port);
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
    });

    beforeEach(async () => {
        await sequelize.sync({ force: true });
        users = await createUsers();
        tags = await createTags();
        unitCategories = await createUnitCategories();
        units = await createUnits(unitCategories);
        categories = await createCategories();
        const recipesData = await createRecipes(tags, units, categories, users);
        recipes = recipesData.recipes;
    });

    it('should should sent notifications', async () => {
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

            const res = await notificationApi.sendNotifications().catch(processError);

            expect(res.status).to.be.equal(204);
            receivedEmail = (await receivedEmailPromise) as Email;
        } finally {
            maildev.close();
        }

        expect(receivedEmail.subject).to.equal('My Cookery Book 2: new recipes');
        expect(receivedEmail.from).to.eql([
            {
                address: process.env.EMAIL_FROM,
                name: ''
            }
        ]);
        expect(receivedEmail.to).to.eql([
            {
                address: users.simple.email,
                name: ''
            }
        ]);
        expect(receivedEmail.text).to.be.a('string');
        expect(receivedEmail.html).to.be.a('string');
        expect(receivedEmail.text).to.equal(`${users.simple.username},${recipes.chicken.name},${recipes.chicken.id}`);
        expect(receivedEmail.html).to.equal(receivedEmail.html);
    });
});
