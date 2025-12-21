import { AllowNull, Column, DataType, ForeignKey, Index, Model, Table } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

import { ROLE } from '../roleEnum';
import User from './user';

interface UserRoleAttributes {
    id: number;
    roleName: ROLE;
    userId: number;
    createdAt: Date;
    updatedAt: Date;
}

@Table({
    timestamps: true,
    paranoid: true
})
class UserRole extends Model<UserRoleAttributes, Optional<UserRoleAttributes, 'id' | 'createdAt' | 'updatedAt'>> {
    @Index({
        name: 'unique-role',
        unique: true
    })
    @AllowNull(false)
    @Column({
        type: DataType.ENUM(...Object.keys(ROLE))
    })
    declare roleName: ROLE;

    @Index({
        name: 'unique-role',
        unique: true
    })
    @AllowNull(false)
    @ForeignKey(() => User)
    @Column
    declare userId: number;

    @Index({
        name: 'unique-role',
        unique: true
    })
    @Column({
        type: DataType.DATE
    })
    declare deletedAt: Date;
}

export default UserRole;
