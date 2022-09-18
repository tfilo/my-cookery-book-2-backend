import {
    Table,
    Column,
    Model,
    HasMany,
    DataType,
    AllowNull,
    ForeignKey,
    BelongsTo,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

import Ingredient from './ingredient';
import Recipe from './recipe';

interface RecipeSectionAttributes {
    id: number;
    name: string | null;
    sortNumber: number;
    method: string | null;
    recipeId: number;
    createdAt: Date;
    updatedAt: Date;
}

interface RecipeSectionCreationAttributes
    extends Optional<
        RecipeSectionAttributes,
        'id' | 'name' | 'method' | 'createdAt' | 'updatedAt'
    > {}

@Table({
    timestamps: true,
})
class RecipeSection extends Model<
    RecipeSectionAttributes,
    RecipeSectionCreationAttributes
> {
    @AllowNull
    @Column({
        type: DataType.STRING(80),
    })
    name: string;

    @AllowNull(false)
    @Column({
        type: DataType.INTEGER,
    })
    sortNumber: number;

    @AllowNull
    @Column({
        type: DataType.TEXT,
    })
    method: string;

    @HasMany(() => Ingredient)
    ingredients: Ingredient[];

    @AllowNull(false)
    @ForeignKey(() => Recipe)
    @Column
    recipeId: number;

    @BelongsTo(() => Recipe)
    recipe: Recipe;
}

export default RecipeSection;
