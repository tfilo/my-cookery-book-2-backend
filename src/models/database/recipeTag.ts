import { Table, Column, Model, ForeignKey } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

import Recipe from './recipe';
import Tag from './tag';

interface RecipeTagAttributes {
    id: number;
    recipeId: number;
    tagId: number;
    createdAt: Date;
    updatedAt: Date;
}

interface RecipeTagCreationAttributes
    extends Optional<RecipeTagAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

@Table({
    timestamps: true,
})
class RecipeTag extends Model<
    RecipeTagAttributes,
    RecipeTagCreationAttributes
> {
    @ForeignKey(() => Recipe)
    @Column
    recipeId: number;

    @ForeignKey(() => Tag)
    @Column
    tagId: number;
}

export default RecipeTag;
