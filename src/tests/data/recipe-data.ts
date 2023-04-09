import Category from '../../models/database/category';
import Ingredient from '../../models/database/ingredient';
import Recipe from '../../models/database/recipe';
import RecipeSection from '../../models/database/recipeSection';
import RecipeTag from '../../models/database/recipeTag';
import Tag from '../../models/database/tag';
import Unit from '../../models/database/unit';
import User from '../../models/database/user';

export default async (
    tags: { [key: string]: Tag },
    units: { [key: string]: Unit },
    categories: { [key: string]: Category },
    users: { [key: string]: User }
) => {
    const recipes: { [key: string]: Recipe } = {};
    const sections: { [key: string]: RecipeSection } = {};
    const ingredients: { [key: string]: Ingredient } = {};

    recipes.chicken = await Recipe.create({
        name: 'Chicken',
        nameSearch: 'chicken',
        description: 'Crispy chicken',
        descriptionSearch: 'crispy chicken',
        serves: 6,
        method: 'Some method how to cook chicken',
        sources: ['www.some.page.com'],
        categoryId: categories.main.id,
        creatorId: users.creator.id,
        modifierId: users.creator.id,
    });

    await RecipeTag.create({
        recipeId: recipes.chicken.id,
        tagId: tags.meat.id,
    });

    sections.section1 = await RecipeSection.create({
        name: 'Main section',
        sortNumber: 1,
        method: 'Some method on main section',
        recipeId: recipes.chicken.id,
    });

    ingredients.chicken = await Ingredient.create({
        name: 'Chicken',
        sortNumber: 1,
        value: 1.2,
        unitId: units.kilogram.id,
        recipeSectionId: sections.section1.id,
    });

    ingredients.paprica = await Ingredient.create({
        name: 'Paprica',
        sortNumber: 2,
        value: 20,
        unitId: units.gram.id,
        recipeSectionId: sections.section1.id,
    });

    sections.section2 = await RecipeSection.create({
        name: 'Rice section',
        sortNumber: 2,
        method: 'Cook rice and serve it with chicken',
        recipeId: recipes.chicken.id,
    });

    ingredients.rice = await Ingredient.create({
        name: 'Rice',
        sortNumber: 1,
        value: 15,
        unitId: units.dekagram.id,
        recipeSectionId: sections.section2.id,
    });

    return {
        recipes,
        sections,
        ingredients,
    };
};
