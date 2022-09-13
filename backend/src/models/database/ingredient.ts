import {
    Table,
    Column,
    Model,
    DataType,
    AllowNull,
    ForeignKey,
    BelongsTo,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

import IngredientSection from './ingredientSection';
import Unit from './unit';

interface IngredientAttributes {
    id: number;
    name: string;
    sortNumber: number;
    value: number | null;
    unitId: number;
    ingredientSectionId: number;
    createdAt: Date;
    updatedAt: Date;
}

interface IngredientCreationAttributes
    extends Optional<
        IngredientAttributes,
        'id' | 'value' | 'createdAt' | 'updatedAt'
    > {}

@Table({
    timestamps: true,
})
class Ingredient extends Model<
    IngredientAttributes,
    IngredientCreationAttributes
> {
    @AllowNull(false)
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
        type: DataType.FLOAT,
    })
    value: number;

    @AllowNull(false)
    @ForeignKey(() => Unit)
    @Column
    unitId: number;

    @BelongsTo(() => Unit)
    unit: Unit;

    @AllowNull(false)
    @ForeignKey(() => IngredientSection)
    @Column
    ingredientSectionId: number;

    @BelongsTo(() => IngredientSection)
    ingredientSection: IngredientSection;
}

export default Ingredient;
