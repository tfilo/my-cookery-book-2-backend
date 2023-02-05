import Ingredient from '../../models/database/ingredient';
import Recipe from '../../models/database/recipe';
import RecipeSection from '../../models/database/recipeSection';
import RecipeTag from '../../models/database/recipeTag';
import Tag from '../../models/database/tag';
import Unit from '../../models/database/unit';

export default async (
    tags: { [key: string]: Tag },
    units: { [key: string]: Unit }
) => {
    const recipes: { [key: string]: Recipe } = {};

    recipes.chicken = await Recipe.create({
        name: 'Chicken',
        nameSearch: 'chicken',
        description: 'Crispy chicken',
        descriptionSearch: 'crispy chicken',
        serves: 6,
        method: 'Some method how to cook chicken',
        sources: ['www.some.page.com'],
        categoryId: 1,
        creatorId: 1,
        modifierId: 1,
    });

    await RecipeTag.create({
        recipeId: recipes.chicken.id,
        tagId: tags.meat.id,
    });

    const section1 = await RecipeSection.create({
        name: 'Main section',
        sortNumber: 1,
        method: 'Some method on main section',
        recipeId: recipes.chicken.id,
    });

    await Ingredient.create({
        name: 'Chicken',
        sortNumber: 1,
        value: 1.2,
        unitId: units.kilogram.id,
        recipeSectionId: section1.id,
    });

    await Ingredient.create({
        name: 'Paprica',
        sortNumber: 2,
        value: 20,
        unitId: units.gram.id,
        recipeSectionId: section1.id,
    });

    const section2 = await RecipeSection.create({
        name: 'Rice section',
        sortNumber: 2,
        method: 'Cook rice and serve it with chicken',
        recipeId: recipes.chicken.id,
    });

    await Ingredient.create({
        name: 'Rice',
        sortNumber: 1,
        value: 15,
        unitId: units.dekagram.id,
        recipeSectionId: section2.id,
    });

    return recipes;
};
