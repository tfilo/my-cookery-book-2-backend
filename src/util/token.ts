import jwt, { Secret } from 'jsonwebtoken';
import User from '../models/database/user';

export const issueToken = (user: User) => {
    const token = jwt.sign(
        {
            userId: user.id,
            roles: user.roles.map((ur) => ur.roleName)
        },
        process.env.TOKEN_SIGN_KEY as Secret,
        { expiresIn: (process.env.TOKEN_VALIDITY as Parameters<typeof jwt.sign>['2']['expiresIn']) ?? '1h' }
    );
    return token;
};

export const issueRefreshToken = (user: User) => {
    const refreshToken = jwt.sign(
        {
            userId: user.id,
            refresh: true
        },
        process.env.TOKEN_SIGN_KEY as Secret,
        { expiresIn: (process.env.REFRESH_TOKEN_VALIDITY as Parameters<typeof jwt.sign>['2']['expiresIn']) ?? '30d' }
    );
    return refreshToken;
};
