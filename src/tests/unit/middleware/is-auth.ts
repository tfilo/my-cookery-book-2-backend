import { Secret } from 'jsonwebtoken';
import Chai from 'chai';
import jwt from 'jsonwebtoken';

import isAuth from '../../../middleware/is-auth';
import CustomError from '../../../models/customError';
import { CUSTOM_ERROR_CODES } from '../../../models/errorCodes';
import { ROLE } from '../../../models/roleEnum';

const expect = Chai.expect;

describe('Auth middleware', function () {
    let env: NodeJS.ProcessEnv;

    before(function () {
        env = process.env;
        process.env = { TOKEN_SIGN_KEY: 'TEST_KEY' };
    });

    after(function () {
        process.env = env;
    });

    it('should throw an error if missing Authorization header', function () {
        const req = {
            get: function () {
                return null;
            },
        };

        const middleware = isAuth();

        //@ts-ignore
        const err = expect(middleware.bind(this, req, {}, () => {})).to.throw(
            CustomError
        );
        err.with.property('statusCode', 401);
        err.with.property('code', CUSTOM_ERROR_CODES.INVALID_CREDENTIALS);
    });

    it('should throw an error if Authorization not contains two parts separated by whitespace character', function () {
        const req = {
            get: function () {
                return 'FAKE TOKEN IT IS';
            },
        };

        const middleware = isAuth();

        //@ts-ignore
        const err = expect(middleware.bind(this, req, {}, () => {})).to.throw(
            CustomError
        );
        err.with.property('statusCode', 401);
        err.with.property('code', CUSTOM_ERROR_CODES.INVALID_CREDENTIALS);
    });

    it("should throw an error if token can' be decoded", function () {
        const req = {
            get: function () {
                return 'FAKE TOKEN';
            },
        };

        const middleware = isAuth();

        //@ts-ignore
        const err = expect(middleware.bind(this, req, {}, () => {})).to.throw(
            CustomError,
            'jwt malformed'
        );
        err.with.property('statusCode', 401);
        err.with.property('code', CUSTOM_ERROR_CODES.INVALID_TOKEN);
    });

    it('should throw an error if token has refresh key', function () {
        const req = {
            get: function () {
                return 'Bearer: ' + issueRefreshToken();
            },
        };

        const middleware = isAuth();

        //@ts-ignore
        const err = expect(middleware.bind(this, req, {}, () => {})).to.throw(
            CustomError
        );
        err.with.property('statusCode', 401);
        err.with.property('code', CUSTOM_ERROR_CODES.INVALID_CREDENTIALS);
    });

    it('should throw an error if role is missing', function () {
        const req = {
            get: function () {
                return 'Bearer: ' + issueCreatorToken();
            },
        };
        
        const middleware = isAuth(ROLE.ADMIN);

        //@ts-ignore
        const err = expect(middleware.bind(this, req, {}, () => {})).to.throw(
            CustomError
        );
        err.with.property('statusCode', 403);
        err.with.property('code', CUSTOM_ERROR_CODES.FORBIDEN);
    });

    it('should allow access if user has specified role', function () {
        const req = {
            get: function () {
                return 'Bearer: ' + issueAdminToken();
            },
            userRoles: Array<string>(),
        };

        //@ts-ignore
        isAuth('ADMIN').bind(this, req, {}, () => {})();

        expect(req).to.have.property('userId');
        expect(req).to.have.property('userId', 1);

        expect(req).to.have.property('userRoles');
        expect(req.userRoles).to.deep.equal([ROLE.ADMIN]);
    });

    it('should allow access if user has at least one role', function () {
        const req = {
            get: function () {
                return 'Bearer: ' + issueCreatorToken();
            },
            userRoles: Array<string>(),
        };

        //@ts-ignore
        isAuth([ROLE.ADMIN, ROLE.CREATOR]).bind(
            this,
            req,
            {},
            () => {}
        )();

        expect(req).to.have.property('userId');
        expect(req).to.have.property('userId', 1);

        expect(req).to.have.property('userRoles');
        expect(req.userRoles).to.deep.equal([ROLE.CREATOR]);
    });
});

const issueAdminToken = () => {
    const token = jwt.sign(
        {
            userId: 1,
            roles: [ROLE.ADMIN],
        },
        process.env.TOKEN_SIGN_KEY as Secret,
        { expiresIn: '1h' }
    );
    return token;
};

const issueCreatorToken = () => {
    const token = jwt.sign(
        {
            userId: 1,
            roles: [ROLE.CREATOR],
        },
        process.env.TOKEN_SIGN_KEY as Secret,
        { expiresIn: '1h' }
    );
    return token;
};

const issueRefreshToken = () => {
    const refreshToken = jwt.sign(
        {
            userId: 1,
            refresh: true,
        },
        process.env.TOKEN_SIGN_KEY as Secret,
        { expiresIn: '10d' }
    );
    return refreshToken;
};
