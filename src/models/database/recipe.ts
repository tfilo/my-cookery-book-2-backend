import { Table, Column, Model, HasMany, DataType, AllowNull, Unique, ForeignKey, BelongsTo, BelongsToMany } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

import Category from './category';
import RecipeSection from './recipeSection';
import Picture from './picture';
import RecipeTag from './recipeTag';
import Tag from './tag';
import User from './user';
import RecipeRecipe from './recipeRecipe';

export interface RecipeAttributes {
    id: number;
    name: string;
    nameSearch: string | null;
    description: string | null;
    descriptionSearch: string | null;
    serves: number | null;
    method: string | null;
    sources: string[];
    categoryId: number;
    modifierId: number;
    creatorId: number;
    createdAt: Date;
    updatedAt: Date;
}

@Table({
    timestamps: true
})
class Recipe extends Model<
    RecipeAttributes,
    Optional<RecipeAttributes, 'id' | 'nameSearch' | 'description' | 'descriptionSearch' | 'serves' | 'method' | 'createdAt' | 'updatedAt'>
> {
    @AllowNull(false)
    @Unique
    @Column({
        type: DataType.STRING(80)
    })
    name: string;

    @AllowNull
    @Column({
        type: DataType.STRING(80)
    })
    nameSearch: string;

    @AllowNull
    @Column({
        type: DataType.STRING(160)
    })
    description: string | null;

    @AllowNull
    @Column({
        type: DataType.STRING(160)
    })
    descriptionSearch: string;

    @AllowNull
    @Column({
        type: DataType.INTEGER
    })
    serves: number;

    @AllowNull
    @Column({
        type: DataType.TEXT
    })
    method: string;

    @AllowNull(false)
    @Column({
        type: DataType.ARRAY(DataType.STRING(1000))
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

    @BelongsTo(() => User, 'creatorId')
    creator: User;

    @AllowNull(false)
    @ForeignKey(() => User)
    @Column
    modifierId: number;

    @BelongsTo(() => User, 'modifierId')
    modifier: User;

    @HasMany(() => RecipeSection, {
        onDelete: 'CASCADE'
    })
    recipeSections: RecipeSection[];

    @BelongsToMany(() => Recipe, () => RecipeRecipe, 'recipeId', 'associatedRecipeId')
    associatedRecipes: Array<Recipe & { RecipeRecipe: RecipeRecipe }>;

    @BelongsToMany(() => Tag, () => RecipeTag)
    tags: Array<Tag & { RecipeTag: RecipeTag }>;

    @HasMany(() => Picture, {
        onDelete: 'CASCADE'
    })
    pictures: Picture[];
}

export default Recipe;
