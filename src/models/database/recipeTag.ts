import { Table, Column, Model, ForeignKey, BelongsTo } from 'sequelize-typescript';
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

    @BelongsTo(() => Recipe)
    recipe: Recipe;

    @ForeignKey(() => Tag)
    @Column
    tagId: number;

    @BelongsTo(() => Tag)
    tag: Tag;
}

export default RecipeTag;
