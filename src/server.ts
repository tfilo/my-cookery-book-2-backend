import 'dotenv/config';

import { app } from './app';
import Category from './models/database/category';
import Recipe from './models/database/recipe';
import RecipeRecipe from './models/database/recipeRecipe';
import Tag from './models/database/tag';
import Unit from './models/database/unit';
import UnitCategory from './models/database/unitCategory';
import User from './models/database/user';
import UserRole from './models/database/userRole';
import { ROLE } from './models/roleEnum';
import sequelize from './util/database';
import toSCDF from './util/string';

const port = process.env.PORT || 8080;

(async () => {
    if (process.env.NODE_ENV === 'development') {
        await sequelize.sync();

        const [user, created] = await User.findOrCreate({
            where: {
                username: 'Test',
            },
            defaults: {
                username: 'Test',
                password: 'Test1234',
            },
        });
        if (created) {
            await UserRole.findOrCreate({
                where: {
                    userId: user.id,
                    roleName: ROLE.ADMIN,
                },
            });
        }

        // Mock data
        await Tag.findOrCreate({
            where: {
                name: 'Huby',
            },
            defaults: {
                name: 'Huby',
            },
        });
        await Tag.findOrCreate({
            where: {
                name: 'Cestoviny',
            },
            defaults: {
                name: 'Cestoviny',
            },
        });
        await Tag.findOrCreate({
            where: {
                name: 'Kysnuté cesto',
            },
            defaults: {
                name: 'Kysnuté cesto',
            },
        });

        const [unitCategory1, createdUC1] = await UnitCategory.findOrCreate({
            where: {
                name: 'Dĺžka',
            },
            defaults: {
                name: 'Dĺžka',
            },
        });

        if (createdUC1) {
            await Unit.findOrCreate({
                where: {
                    name: 'Centimeter',
                },
                defaults: {
                    name: 'Centimeter',
                    abbreviation: 'cm',
                    required: true,
                    unitCategoryId: unitCategory1.id,
                },
            });
        }

        const [unitCategory2, createdUC2] = await UnitCategory.findOrCreate({
            where: {
                name: 'Hmotnosť',
            },
            defaults: {
                name: 'Hmotnosť',
            },
        });

        if (createdUC2) {
            await Unit.findOrCreate({
                where: {
                    name: 'Dekagram',
                },
                defaults: {
                    name: 'Dekagram',
                    abbreviation: 'dkg',
                    required: true,
                    unitCategoryId: unitCategory2.id,
                },
            });
            await Unit.findOrCreate({
                where: {
                    name: 'Gram',
                },
                defaults: {
                    name: 'Gram',
                    abbreviation: 'g',
                    required: true,
                    unitCategoryId: unitCategory2.id,
                },
            });
            await Unit.findOrCreate({
                where: {
                    name: 'Kilogram',
                },
                defaults: {
                    name: 'Kilogram',
                    abbreviation: 'kg',
                    required: true,
                    unitCategoryId: unitCategory2.id,
                },
            });
        }

        const [unitCategory3, createdUC3] = await UnitCategory.findOrCreate({
            where: {
                name: 'Množstvo',
            },
            defaults: {
                name: 'Množstvo',
            },
        });

        if (createdUC3) {
            await Unit.findOrCreate({
                where: {
                    name: 'Balenie',
                },
                defaults: {
                    name: 'Balenie',
                    abbreviation: 'bal.',
                    required: true,
                    unitCategoryId: unitCategory3.id,
                },
            });
            await Unit.findOrCreate({
                where: {
                    name: 'Hrsť',
                },
                defaults: {
                    name: 'Hrsť',
                    abbreviation: 'hr.',
                    required: true,
                    unitCategoryId: unitCategory3.id,
                },
            });
            await Unit.findOrCreate({
                where: {
                    name: 'Kus',
                },
                defaults: {
                    name: 'Kus',
                    abbreviation: 'ks.',
                    required: true,
                    unitCategoryId: unitCategory3.id,
                },
            });
            await Unit.findOrCreate({
                where: {
                    name: 'Šálka',
                },
                defaults: {
                    name: 'Šálka',
                    abbreviation: 'šál.',
                    required: true,
                    unitCategoryId: unitCategory3.id,
                },
            });
        }

        await Category.findOrCreate({
            where: {
                name: 'Dezerty',
            },
            defaults: {
                name: 'Dezerty',
            },
        });

        await Category.findOrCreate({
            where: {
                name: 'Hlavné jedlá',
            },
            defaults: {
                name: 'Hlavné jedlá',
            },
        });

        await Category.findOrCreate({
            where: {
                name: 'Pečivo',
            },
            defaults: {
                name: 'Pečivo',
            },
        });

        await Category.findOrCreate({
            where: {
                name: 'Ostatné',
            },
            defaults: {
                name: 'Ostatné',
            },
        });

        const [sideDishes, sideDishesCreated] = await Category.findOrCreate({
            where: {
                name: 'Prílohy',
            },
            defaults: {
                name: 'Prílohy',
            },
        });

        const [soupCat, createdSoupCat] = await Category.findOrCreate({
            where: {
                name: 'Polievky',
            },
            defaults: {
                name: 'Polievky',
            },
        });

        let soup: Recipe | undefined = undefined;
        if (createdSoupCat) {
            soup = (
                await Recipe.findOrCreate({
                    where: {
                        name: 'Polievka',
                    },
                    defaults: {
                        name: 'Polievka',
                        categoryId: soupCat.id,
                        creatorId: user.id,
                        modifierId: user.id,
                        method: 'Toto je vymyslený postup na fiktívnu polievku',
                        sources: ['vymyslený recept'],
                        description: 'Výborná polievka',
                        nameSearch: toSCDF('Polievka').toLowerCase().trim(),
                        descriptionSearch: toSCDF('Výborná polievka')
                            .toLowerCase()
                            .trim(),
                        serves: 8,
                    },
                })
            )[0];
        }

        let noodles: Recipe | undefined = undefined;
        if (sideDishesCreated) {
            noodles = (
                await Recipe.findOrCreate({
                    where: {
                        name: 'Rezance',
                    },
                    defaults: {
                        name: 'Rezance',
                        categoryId: sideDishes.id,
                        creatorId: user.id,
                        modifierId: user.id,
                        method: 'Toto je vymyslený postup na rezance pre fiktívnu polievku',
                        sources: ['uvar rezance podla postupu na obale'],
                        description: 'Klasicke rezance k polievke',
                        nameSearch: toSCDF('Rezance').toLowerCase().trim(),
                        descriptionSearch: toSCDF('Klasicke rezance k polievke')
                            .toLowerCase()
                            .trim(),
                        serves: 8,
                    },
                })
            )[0];
        }

        await RecipeRecipe.findOrCreate({
            where: {
                recipeId: soup?.id,
                associatedRecipeId: noodles?.id,
            },
            defaults: {
                recipeId: soup?.id,
                associatedRecipeId: noodles?.id,
            },
        });
    }

    app.listen(port, () => console.info(`Server running on port ${port}`));
})();
