import { Table, Column, Model, ForeignKey } from 'sequelize-typescript';
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

    @ForeignKey(() => Recipe)
    @Column
    associatedRecipeId: number;
}

export default RecipeRecipe;
