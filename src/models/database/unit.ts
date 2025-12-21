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
    declare name: string;

    @AllowNull(false)
    @Unique
    @Column({
        type: DataType.STRING(20)
    })
    declare abbreviation: string;

    @AllowNull(false)
    @Column({
        type: DataType.BOOLEAN
    })
    declare required: boolean;

    @AllowNull(false)
    @ForeignKey(() => UnitCategory)
    @Column
    declare unitCategoryId: number;

    @BelongsTo(() => UnitCategory)
    declare unitCategory: UnitCategory;

    @HasMany(() => Ingredient, {
        onDelete: 'RESTRICT'
    })
    declare ingredients: Ingredient[];
}

export default Unit;
