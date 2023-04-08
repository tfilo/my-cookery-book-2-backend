import Chai from 'chai';

import toSCDF from '../../../util/string';

const expect = Chai.expect;

describe('String util', function () {
    it('should remove accents from string', function () {
        const phrase = 'ľščťžýáíéúäôČŽŤ';
        const scdf = toSCDF(phrase);
        expect(scdf).to.equal('lsctzyaieuaoCZT');
    });
});