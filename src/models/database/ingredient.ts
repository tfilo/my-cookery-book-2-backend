import { Table, Column, Model, DataType, AllowNull, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

import RecipeSection from './recipeSection';
import Unit from './unit';

interface IngredientAttributes {
    id: number;
    name: string;
    sortNumber: number;
    value: number | null;
    unitId: number;
    recipeSectionId: number;
    createdAt: Date;
    updatedAt: Date;
}

@Table({
    timestamps: true
})
class Ingredient extends Model<IngredientAttributes, Optional<IngredientAttributes, 'id' | 'value' | 'createdAt' | 'updatedAt'>> {
    @AllowNull(false)
    @Column({
        type: DataType.STRING(80)
    })
    declare name: string;

    @AllowNull(false)
    @Column({
        type: DataType.INTEGER
    })
    declare sortNumber: number;

    @AllowNull
    @Column({
        type: DataType.FLOAT
    })
    declare value: number;

    @AllowNull(false)
    @ForeignKey(() => Unit)
    @Column
    declare unitId: number;

    @BelongsTo(() => Unit)
    declare unit: Unit;

    @AllowNull(false)
    @ForeignKey(() => RecipeSection)
    @Column
    declare recipeSectionId: number;

    @BelongsTo(() => RecipeSection, {
        onDelete: 'CASCADE'
    })
    declare recipeSection: RecipeSection;
}

export default Ingredient;
