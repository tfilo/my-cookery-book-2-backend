import { expect } from 'chai';
import * as yup from 'yup';

import validate from '../../../middleware/validate';
import CustomError from '../../../models/customError';
import { CUSTOM_ERROR_CODES } from '../../../models/errorCodes';

describe('Validate middleware', function () {
    it('should throw error when req contains validation errors', async function () {
        const req = {
            params: {
                id: 'Test'
            }
        };

        const schema = yup.object({
            params: yup.object({
                id: yup.number().min(1).required()
            })
        });

        let err = null;
        const validator = validate(schema);
        // @ts-expect-error just for test
        await validator(req, {}, (error) => {
            err = error;
        });

        expect(err).to.instanceOf(CustomError);
        expect(err).with.property('statusCode', 422);
        expect(err).with.property('code', CUSTOM_ERROR_CODES.VALIDATION_FAILED);
    });

    it('should continue if request has no errors', function () {
        let nextCalled = false;

        // @ts-expect-error just for test
        validate().bind(this, {}, {}, () => {
            nextCalled = true;
        })();

        expect(nextCalled).to.equal(true);
    });
});
