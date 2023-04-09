import User from '../../models/database/user';
import UserRole from '../../models/database/userRole';
import { ROLE } from '../../models/roleEnum';

export default async () => {
    const users: { [key: string]: User } = {};

    users.admin = await User.create({
        username: 'admin',
        firstName: 'Best',
        lastName: 'Admin',
        password: 'Admin123',
        email: 'admin@test.test',
        confirmed: true,
        notifications: false,
    });

    await UserRole.create({
        userId: users.admin.id,
        roleName: ROLE.ADMIN,
    });

    users.creator = await User.create({
        username: 'creator',
        password: 'Creator123',
        email: 'creator@test.test',
        confirmed: true,
        notifications: true,
    });

    await UserRole.create({
        userId: users.creator.id,
        roleName: ROLE.CREATOR,
    });

    users.creator2 = await User.create({
        username: 'creator2',
        password: 'Creator2123',
        email: 'creator2@test.test',
        confirmed: false,
        notifications: false,
        uuid: '511f1466-02b4-4605-af0f-eaf33afc8dd0',
    });

    await UserRole.create({
        userId: users.creator2.id,
        roleName: ROLE.CREATOR,
    });

    users.simple = await User.create({
        username: 'simple',
        password: 'Simple123',
        email: 'simple@test.test',
        confirmed: true,
        notifications: true,
    });

    users.admin = (await User.findByPk(users.admin.id, {
        include: {
            model: UserRole,
            required: false,
            attributes: ['roleName'],
        },
    }))!;

    users.creator = (await User.findByPk(users.creator.id, {
        include: {
            model: UserRole,
            required: false,
            attributes: ['roleName'],
        },
    }))!;

    users.creator2 = (await User.findByPk(users.creator2.id, {
        include: {
            model: UserRole,
            required: false,
            attributes: ['roleName'],
        },
    }))!;

    users.simple = (await User.findByPk(users.simple.id, {
        include: {
            model: UserRole,
            required: false,
            attributes: ['roleName'],
        },
    }))!;

    return users;
};
