import {
    Table,
    Column,
    Model,
    HasMany,
    DataType,
    AllowNull,
    Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

import Unit from './unit';

interface UnitCategoryAttributes {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}

interface UnitCategoryCreationAttributes
    extends Optional<
        UnitCategoryAttributes,
        'id' | 'createdAt' | 'updatedAt'
    > {}

@Table({
    timestamps: true,
})
class UnitCategory extends Model<
    UnitCategoryAttributes,
    UnitCategoryCreationAttributes
> {
    @AllowNull(false)
    @Unique
    @Column({
        type: DataType.STRING(80),
    })
    name: string;

    @HasMany(() => Unit, {
        onDelete: 'RESTRICT',
    })
    units: Unit[];
}

export default UnitCategory;
