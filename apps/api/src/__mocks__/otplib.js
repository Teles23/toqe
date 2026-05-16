'use strict';
module.exports = {
  generateSecret: jest.fn().mockReturnValue('MOCK_SECRET'),
  generateURI: jest
    .fn()
    .mockReturnValue(
      'otpauth://totp/Toqe:test@test.com?secret=MOCK_SECRET&issuer=Toqe',
    ),
  verify: jest.fn().mockResolvedValue({ valid: true }),
};
