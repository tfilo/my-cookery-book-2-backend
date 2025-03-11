import { Table, Column, Model, HasMany, DataType, AllowNull, Unique } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

import Unit from './unit';

interface UnitCategoryAttributes {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

@Table({
    timestamps: true
})
class UnitCategory extends Model<UnitCategoryAttributes, Optional<UnitCategoryAttributes, 'id' | 'createdAt' | 'updatedAt'>> {
    @AllowNull(false)
    @Unique
    @Column({
        type: DataType.STRING(80)
    })
    name: string;

    @HasMany(() => Unit, {
        onDelete: 'RESTRICT'
    })
    units: Unit[];
}

export default UnitCategory;
