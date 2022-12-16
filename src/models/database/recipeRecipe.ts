import {
    Table,
    Column,
    Model,
    ForeignKey,
} from 'sequelize-typescript';

import Recipe from './recipe';

interface RecipeRecipeAttributes {
    recipeId: number;
    associatedRecipeId: number;
}

@Table({
    timestamps: false,
})
class RecipeRecipe extends Model<
    RecipeRecipeAttributes,
    RecipeRecipeAttributes
> {
    @ForeignKey(() => Recipe)
    @Column
    recipeId: number;

    @ForeignKey(() => Recipe)
    @Column
    associatedRecipeId: number;
}

export default RecipeRecipe;
