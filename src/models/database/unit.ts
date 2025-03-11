import { Table, Column, Model, DataType, AllowNull, Unique, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

import Ingredient from './ingredient';
import UnitCategory from './unitCategory';

interface UnitAttributes {
    id: number;
    name: string;
    abbreviation: string;
    required: boolean;
    unitCategoryId: number;
    createdAt: Date;
    updatedAt: Date;
}

@Table({
    timestamps: true
})
class Unit extends Model<UnitAttributes, Optional<UnitAttributes, 'id' | 'createdAt' | 'updatedAt'>> {
    @AllowNull(false)
    @Unique
    @Column({
        type: DataType.STRING(80)
    })
    name: string;

    @AllowNull(false)
    @Unique
    @Column({
        type: DataType.STRING(20)
    })
    abbreviation: string;

    @AllowNull(false)
    @Column({
        type: DataType.BOOLEAN
    })
    required: boolean;

    @AllowNull(false)
    @ForeignKey(() => UnitCategory)
    @Column
    unitCategoryId: number;

    @BelongsTo(() => UnitCategory)
    unitCategory: UnitCategory;

    @HasMany(() => Ingredient, {
        onDelete: 'RESTRICT'
    })
    ingredients: Ingredient[];
}

export default Unit;
