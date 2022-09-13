import bcrypt from 'bcryptjs';
import {
    Table,
    Column,
    AllowNull,
    Unique,
    Model,
    HasMany,
    DataType,
    DefaultScope,
    Scopes,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Recipe from './recipe';

import UserRole from './userRole';

export interface UserAttributes {
    id: number;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    createdAt: Date;
    updatedAt: Date;
}

interface UserCreationAttributes
    extends Optional<
        UserAttributes,
        'id' | 'firstName' | 'lastName' | 'password' | 'createdAt' | 'updatedAt'
    > {}

@DefaultScope(() => ({
    attributes: { exclude: ['password'] },
}))
@Scopes(() => ({
    authScope: {
        attributes: ['id', 'username', 'password'],
        include: {
            model: UserRole,
            required: false,
            attributes: ['roleName'],
        },
    },
    internalScope: {
        attributes: ['id', 'username'],
    },
    listScope: {
        attributes: ['id', 'firstName', 'lastName'],
    },
}))
@Table({
    timestamps: true,
})
class User extends Model<UserAttributes, UserCreationAttributes> {
    @AllowNull(false)
    @Unique
    @Column({
        type: DataType.STRING(50),
    })
    username: string;

    @AllowNull(false)
    @Column({
        type: DataType.STRING(60), // bcryptjs has has 60 characters
    })
    get password(): string {
        return this.getDataValue('password');
    }

    set password(value: string) {
        this.setDataValue('password', bcrypt.hashSync(value, 12));
    }

    @AllowNull(true)
    @Column({
        type: DataType.STRING(50),
    })
    firstName: string;

    @AllowNull(true)
    @Column({
        type: DataType.STRING(50),
    })
    lastName: string;

    @HasMany(() => UserRole)
    roles: UserRole[];

    @HasMany(() => Recipe, {
        foreignKey: 'creatorId',
        onDelete: 'RESTRICT',
    })
    createdRecipes: Recipe[];

    @HasMany(() => Recipe, {
        foreignKey: 'modifierId',
        onDelete: 'RESTRICT',
    })
    updatedRecipes: Recipe[];
}

export default User;
