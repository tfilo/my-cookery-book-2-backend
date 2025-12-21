import { Table, Column, Model, ForeignKey } from 'sequelize-typescript';

import Recipe from './recipe';
import Tag from './tag';

interface RecipeTagAttributes {
    recipeId: number;
    tagId: number;
}

@Table({
    timestamps: false
})
class RecipeTag extends Model<RecipeTagAttributes, RecipeTagAttributes> {
    @ForeignKey(() => Recipe)
    @Column
    declare recipeId: number;

    @ForeignKey(() => Tag)
    @Column
    declare tagId: number;
}

export default RecipeTag;
