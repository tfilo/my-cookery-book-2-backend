import { Table, Column, Model, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

import Recipe from './recipe';

interface RecipeRecipeAttributes {
    id: number;
    recipeId: number;
    associatedRecipeId: number;
    createdAt: Date;
    updatedAt: Date;
}

interface RecipeRecipeCreationAttributes
    extends Optional<
        RecipeRecipeAttributes,
        'id' | 'createdAt' | 'updatedAt'
    > {}

@Table({
    timestamps: true,
})
class RecipeRecipe extends Model<
    RecipeRecipeAttributes,
    RecipeRecipeCreationAttributes
> {
    @ForeignKey(() => Recipe)
    @Column
    recipeId: number;

    @BelongsTo(() => Recipe)
    recipe: Recipe;

    @ForeignKey(() => Recipe)
    @Column
    associatedRecipeId: number;

    @BelongsTo(() => Recipe)
    associatedRecipe: Recipe;
}

export default RecipeRecipe;
