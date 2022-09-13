import {
    Table,
    Column,
    Model,
    HasMany,
    DataType,
    AllowNull,
    Unique,
    ForeignKey,
    BelongsTo,
    BeforeUpdate,
    BeforeCreate,
    BelongsToMany,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

import toSCDF from '../../util/string';
import Category from './category';
import IngredientSection from './ingredientSection';
import Picture from './picture';
import RecipeRecipe from './recipeRecipe';
import RecipeTag from './recipeTag';
import Tag from './tag';
import User from './user';

export interface RecipeAttributes {
    id: number;
    name: string;
    nameSearch: string | null;
    description: string | null;
    descriptionSearch: string | null;
    serves: number | null;
    method: string;
    sources: string[];
    categoryId: number;
    modifierId: number;
    creatorId: number;
    createdAt: Date;
    updatedAt: Date;
}

interface RecipeCreationAttributes
    extends Optional<
        RecipeAttributes,
        | 'id'
        | 'nameSearch'
        | 'description'
        | 'descriptionSearch'
        | 'serves'
        | 'createdAt'
        | 'updatedAt'
    > {}

@Table({
    timestamps: true,
})
class Recipe extends Model<RecipeAttributes, RecipeCreationAttributes> {
    @AllowNull(false)
    @Unique
    @Column({
        type: DataType.STRING(80),
    })
    name: string;

    @AllowNull
    @Column({
        type: DataType.STRING(80),
    })
    nameSearch: string;

    @AllowNull
    @Column({
        type: DataType.STRING(160),
    })
    description: string;

    @AllowNull
    @Column({
        type: DataType.STRING(160),
    })
    descriptionSearch: string;

    @AllowNull
    @Column({
        type: DataType.INTEGER,
    })
    serves: number;

    @AllowNull(false)
    @Column({
        type: DataType.TEXT,
    })
    method: string;

    @AllowNull(false)
    @Column({
        type: DataType.ARRAY(DataType.STRING(1000)),
    })
    sources: string[];

    @AllowNull(false)
    @ForeignKey(() => Category)
    @Column
    categoryId: number;

    @BelongsTo(() => Category)
    category: Category;

    @AllowNull(false)
    @ForeignKey(() => User)
    @Column
    creatorId: number;

    @BelongsTo(() => User)
    creator: User;

    @AllowNull(false)
    @ForeignKey(() => User)
    @Column
    modifierId: number;

    @BelongsTo(() => User)
    modified: User;

    @HasMany(() => IngredientSection)
    ingredientSections: IngredientSection[];

    @BelongsToMany(() => Recipe, () => RecipeRecipe, 'id', 'associatedRecipeId')
    associatedRecipes: Recipe[];

    @BelongsToMany(() => Tag, () => RecipeTag)
    tags: Tag[];

    @HasMany(() => Picture)
    pictures: Picture[];

    @BeforeUpdate
    @BeforeCreate
    static makeUpperCase(instance: Recipe) {
        instance.nameSearch = toSCDF(instance.name).toLowerCase().trim();
        instance.descriptionSearch = toSCDF(instance.description)
            .toLowerCase()
            .trim();
    }
}

export default Recipe;
