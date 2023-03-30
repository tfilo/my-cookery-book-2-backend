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
import { Api, AuthApi, Configuration, RecipeApi } from '../openapi';
import Chai from 'chai';
import chaiExclude from 'chai-exclude';
import createUsers from '../data/user-data';
import createCategories from '../data/category-data';
import createUnits from '../data/unit-data';
import createUnitCategories from '../data/unitCategory-data';
import createRecipes from '../data/recipe-data';
import createTags from '../data/tag-data';
import createPictures from '../data/picture-data';
import User from '../../models/database/user';
import Tag from '../../models/database/tag';
import { createUnit } from '../../controllers/unit';
import UnitCategory from '../../models/database/unitCategory';
import Unit from '../../models/database/unit';
import Category from '../../models/database/category';
import Recipe from '../../models/database/recipe';
import { issueToken } from '../../util/token';
import { processError } from '../utils/error';
import Picture from '../../models/database/picture';
import RecipeSection from '../../models/database/recipeSection';
import Ingredient from '../../models/database/ingredient';

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

describe('Recipe', () => {
    let users: { [key: string]: User };
    let tags: { [key: string]: Tag };
    let unitCategories: { [key: string]: UnitCategory };
    let units: { [key: string]: Unit };
    let categories: { [key: string]: Category };
    let recipes: { [key: string]: Recipe };
    let sections: { [key: string]: RecipeSection };
    let ingredients: { [key: string]: Ingredient };
    let pictures: { [key: string]: Picture };

    let serverInstance: Server;
    let databaseContainer: StartedPostgreSqlContainer;
    const recipeApi = new RecipeApi(config);

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
        unitCategories = await createUnitCategories();
        units = await createUnits(unitCategories);
        categories = await createCategories();
        const recipesData = await createRecipes(tags, units, categories, users);
        recipes = recipesData.recipes;
        sections = recipesData.sections;
        ingredients = recipesData.ingredients;
        pictures = await createPictures(recipes);
    });

    it('should find recipes', async () => {
        // prepare valid token
        const token = issueToken(users.simple);
        setToken(token);

        const res = await recipeApi
            .findRecipe({
                categoryId: null,
                search: null,
                order: Api.RecipeSearchCriteria.OrderEnum.ASC,
                orderBy: Api.RecipeSearchCriteria.OrderByEnum.Name,
                tags: [],
                page: 0,
                pageSize: 10,
            })
            .catch(processError);
        expect(res.page).to.be.equal(0);
        expect(res.pageSize).to.equal(10);
        expect(res.count).to.equal(1);
        expect(res.rows).has.lengthOf(Object.keys(recipes).length);
        expect(res.rows).to.eql(
            Object.keys(recipes).map((k) => {
                return {
                    id: recipes[k].id,
                    name: recipes[k].name,
                    description: recipes[k].description,
                    pictures: [
                        {
                            id: pictures.sample.id,
                        },
                    ],
                    creatorId: recipes[k].creatorId,
                };
            })
        );
    });

    it('should find recipes and fail on authentication', async () => {
        const res = await recipeApi
            .findRecipe({
                categoryId: null,
                search: null,
                order: Api.RecipeSearchCriteria.OrderEnum.ASC,
                orderBy: Api.RecipeSearchCriteria.OrderByEnum.Name,
                tags: [],
                page: 0,
                pageSize: 10,
            })
            .catch(processError);
        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: '',
        });
    });

    it('should find recipes and fail on validation', async () => {
        // prepare valid token
        const token = issueToken(users.simple);
        setToken(token);

        const res = await recipeApi
            .findRecipe({
                //@ts-ignore
                categoryId: 'aaa',
                //@ts-ignore
                search: 'bbb',
                order: Api.RecipeSearchCriteria.OrderEnum.ASC,
                orderBy: Api.RecipeSearchCriteria.OrderByEnum.Name,
                //@ts-ignore
                tags: 'xyz',
                page: 0,
                pageSize: 10,
            })
            .catch(processError);

        expect(res).to.eql({
            message: '',
            code: 'VALIDATION_FAILED',
            fields: {
                categoryId: 'invalidValue',
                tags: 'invalidValue',
            },
            statusCode: 422,
        });
    });

    it('should get recipe by id', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await recipeApi
            .getRecipe(recipes.chicken.id)
            .catch(processError);
        expect(res).to.eql({
            id: recipes.chicken.id,
            name: recipes.chicken.name,
            description: recipes.chicken.description,
            serves: recipes.chicken.serves,
            method: recipes.chicken.method,
            sources: recipes.chicken.sources,
            associatedRecipes: [],
            categoryId: recipes.chicken.categoryId,
            creatorId: recipes.chicken.creatorId,
            creator: {
                username: users.creator.username,
                firstName: null,
                lastName: null,
            },
            modifierId: recipes.chicken.modifierId,
            modifier: {
                username: users.creator.username,
                firstName: null,
                lastName: null,
            },
            pictures: [
                {
                    id: pictures.sample.id,
                    name: pictures.sample.name,
                    sortNumber: pictures.sample.sortNumber,
                },
            ],
            recipeSections: [
                {
                    id: sections.section1.toJSON().id,
                    method: sections.section1.toJSON().method,
                    name: sections.section1.toJSON().name,
                    sortNumber: sections.section1.toJSON().sortNumber,
                    ingredients: [
                        {
                            id: ingredients.chicken.toJSON().id,
                            name: ingredients.chicken.toJSON().name,
                            sortNumber: ingredients.chicken.toJSON().sortNumber,
                            unitId: ingredients.chicken.toJSON().unitId,
                            unit: {
                                abbreviation: units.kilogram.abbreviation,
                                name: units.kilogram.name,
                            },
                            value: ingredients.chicken.toJSON().value,
                        },
                        {
                            id: ingredients.paprica.toJSON().id,
                            name: ingredients.paprica.toJSON().name,
                            sortNumber: ingredients.paprica.toJSON().sortNumber,
                            unitId: ingredients.paprica.toJSON().unitId,
                            unit: {
                                abbreviation: units.gram.abbreviation,
                                name: units.gram.name,
                            },
                            value: ingredients.paprica.toJSON().value,
                        },
                    ],
                },
                {
                    id: sections.section2.toJSON().id,
                    method: sections.section2.toJSON().method,
                    name: sections.section2.toJSON().name,
                    sortNumber: sections.section2.toJSON().sortNumber,
                    ingredients: [
                        {
                            id: ingredients.rice.toJSON().id,
                            name: ingredients.rice.toJSON().name,
                            sortNumber: ingredients.rice.toJSON().sortNumber,
                            unitId: ingredients.rice.toJSON().unitId,
                            unit: {
                                abbreviation: units.dekagram.abbreviation,
                                name: units.dekagram.name,
                            },
                            value: ingredients.rice.toJSON().value,
                        },
                    ],
                },
            ],
            tags: [
                {
                    id: tags.meat.id,
                    name: tags.meat.name,
                },
            ],
            createdAt: recipes.chicken.createdAt.toISOString(),
            updatedAt: recipes.chicken.updatedAt.toISOString(),
        });
    });

    it('should try get recipe by id and fail on authentication', async () => {
        const res = await recipeApi
            .getRecipe(recipes.chicken.id)
            .catch(processError);

        expect(res).to.eql({
            statusCode: 401,
            code: 'INVALID_CREDENTIALS',
            message: '',
        });
    });

    it('should try get recipe by id and fail on recipe not exists', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await recipeApi.getRecipe(9999999).catch(processError);

        expect(res).to.eql({
            statusCode: 404,
            code: 'NOT_FOUND',
            message: '',
        });
    });

    it('should create recipe with minimal data', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await recipeApi
            .createRecipe({
                name: 'Test recipe',
                description: null,
                serves: null,
                method: null,
                sources: [],
                categoryId: categories.main.id,
                recipeSections: [],
                tags: [],
                pictures: [],
                associatedRecipes: [],
            })
            .catch(processError);

        expect(res.id).to.be.a('number');
    });

    // TODO create recipe with full data fields

    it('should try create recipe and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.simple);
        setToken(token);

        const res = await recipeApi
            .createRecipe({
                name: 'Test recipe',
                description: null,
                serves: null,
                method: null,
                sources: [],
                categoryId: categories.main.id,
                recipeSections: [],
                tags: [],
                pictures: [],
                associatedRecipes: [],
            })
            .catch(processError);

        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: '',
        });
    });

    it('should try create recipe and fail on duplicity', async () => {
        // prepare valid token
        const token = issueToken(users.creator);
        setToken(token);

        const res = await recipeApi
            .createRecipe({
                name: 'Chicken',
                description: null,
                serves: null,
                method: null,
                sources: [],
                categoryId: categories.main.id,
                recipeSections: [],
                tags: [],
                pictures: [],
                associatedRecipes: [],
            })
            .catch(processError);

        expect(res).to.eql({
            code: 'UNIQUE_CONSTRAINT_ERROR',
            fields: {
                name: 'not_unique',
            },
            statusCode: 409,
        });
    });
    /*
    it('should try create recipe and fail on validation', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should update recipe', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try update recipe and fail on roles', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try update recipe and fail on duplicity', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });

    it('should try update recipe and fail on validation', async () => {
        try {

        } catch (err) {
            expect.fail('should never fail');
        }
    });
    */

    it('should delete recipe', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);
        const res = await recipeApi
            .deleteRecipe(recipes.chicken.id)
            .catch(processError);
        expect(res.status).to.equals(204);
    });

    it('should try delete recipe and fail on roles', async () => {
        // prepare valid token
        const token = issueToken(users.simple);
        setToken(token);
        const res = await recipeApi
            .deleteRecipe(recipes.chicken.id)
            .catch(processError);
        expect(res).to.eql({
            statusCode: 403,
            code: 'FORBIDEN',
            message: '',
        });
    });

    it('should try delete recipe and fail on recipe not exists', async () => {
        // prepare valid token
        const token = issueToken(users.admin);
        setToken(token);

        const res = await recipeApi.deleteRecipe(9999999).catch(processError);
        expect(res).to.eql({
            statusCode: 404,
            code: 'NOT_FOUND',
            message: '',
        });
    });
});
