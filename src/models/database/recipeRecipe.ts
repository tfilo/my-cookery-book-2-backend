import { Table, Column, Model, ForeignKey } from 'sequelize-typescript';

import Recipe from './recipe';

interface RecipeRecipeAttributes {
    recipeId: number;
    associatedRecipeId: number;
}

@Table({
    timestamps: false
})
class RecipeRecipe extends Model<RecipeRecipeAttributes, RecipeRecipeAttributes> {
    @ForeignKey(() => Recipe)
    @Column
    declare recipeId: number;

    @ForeignKey(() => Recipe)
    @Column
    declare associatedRecipeId: number;
}

export default RecipeRecipe;
