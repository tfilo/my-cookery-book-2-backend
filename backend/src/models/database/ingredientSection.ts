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

interface IngredientSectionAttributes {
    id: number;
    name: string | null;
    sortNumber: number;
    recipeId: number;
    createdAt: Date;
    updatedAt: Date;
}

interface IngredientSectionCreationAttributes
    extends Optional<
        IngredientSectionAttributes,
        'id' | 'name' | 'createdAt' | 'updatedAt'
    > {}

@Table({
    timestamps: true,
})
class IngredientSection extends Model<
    IngredientSectionAttributes,
    IngredientSectionCreationAttributes
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

    @HasMany(() => Ingredient)
    ingredients: Ingredient[];

    @AllowNull(false)
    @ForeignKey(() => Recipe)
    @Column
    recipeId: number;

    @BelongsTo(() => Recipe)
    recipe: Recipe;
}

export default IngredientSection;
