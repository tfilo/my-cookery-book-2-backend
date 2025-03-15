import { expect } from 'chai';
import sinon from 'sinon';
import jwt, { Secret } from 'jsonwebtoken';
import { CUSTOM_ERROR_CODES } from '../../../models/errorCodes';
import decodeAndValidatRefreshToken from '../../../util/decodeAndValidatRefreshToken';
import User from '../../../models/database/user';
import { ROLE } from '../../../models/roleEnum';

describe('Decode and validate refresh token', function () {
    let env: NodeJS.ProcessEnv;

    before(function () {
        env = process.env;
        process.env = { TOKEN_SIGN_KEY: 'TEST_KEY' };
    });

    after(function () {
        process.env = env;
    });

    it("should throw an error if token can' be decoded", function (done) {
        decodeAndValidatRefreshToken('').catch((err) => {
            expect(err).to.property('statusCode', 401);
            expect(err).to.property('code', CUSTOM_ERROR_CODES.INVALID_TOKEN);
            done();
        });
    });

    it('should throw an error if token missing refresh key', function (done) {
        decodeAndValidatRefreshToken(issueToken()).catch((err) => {
            expect(err).to.property('statusCode', 401);
            expect(err).to.property('code', CUSTOM_ERROR_CODES.INVALID_CREDENTIALS);
            done();
        });
    });

    it('should allow access if it is refresh token', function (done) {
        const user = {
            id: 1
        };

        // @ts-expect-error just for test
        const stub = sinon.stub(User, 'findOne').resolves(user);

        decodeAndValidatRefreshToken(issueRefreshToken()).then((userId) => {
            expect(userId).to.equal(1);
            stub.restore();
            done();
        });
    });
});

const issueToken = () => {
    const token = jwt.sign(
        {
            userId: 1,
            roles: [ROLE.ADMIN, ROLE.CREATOR]
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
            refresh: true
        },
        process.env.TOKEN_SIGN_KEY as Secret,
        { expiresIn: '10d' }
    );
    return refreshToken;
};
