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
    name: string;

    @AllowNull(false)
    @Column({
        type: DataType.INTEGER
    })
    sortNumber: number;

    @AllowNull
    @Column({
        type: DataType.FLOAT
    })
    value: number;

    @AllowNull(false)
    @ForeignKey(() => Unit)
    @Column
    unitId: number;

    @BelongsTo(() => Unit)
    unit: Unit;

    @AllowNull(false)
    @ForeignKey(() => RecipeSection)
    @Column
    recipeSectionId: number;

    @BelongsTo(() => RecipeSection, {
        onDelete: 'CASCADE'
    })
    recipeSection: RecipeSection;
}

export default Ingredient;
