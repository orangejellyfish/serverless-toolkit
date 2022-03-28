import responseJSON from '.';

describe('JSON response utility', () => {
  it('should add the expected status code', () => {
    expect(responseJSON(200)).toHaveProperty('statusCode', 200);
  });

  it('should add CORS headers', () => {
    expect(responseJSON(200)).toHaveProperty('headers.Access-Control-Allow-Origin', '*');
    expect(responseJSON(200)).toHaveProperty('headers.Access-Control-Allow-Credentials', true);
  });

  it('should return valid JSON in the body given a string', () => {
    expect(responseJSON(200, 'bar')).toHaveProperty('body', JSON.stringify('bar'));
  });

  it('should return valid JSON in the body given a number', () => {
    expect(responseJSON(200, 123)).toHaveProperty('body', JSON.stringify(123));
  });

  it('should return valid JSON in the body given a boolean', () => {
    expect(responseJSON(200, true)).toHaveProperty('body', JSON.stringify(true));
  });

  it('should return valid JSON in body given an array', () => {
    expect(responseJSON(200, [{ foo: 'bar' }])).toHaveProperty('body', JSON.stringify([{ foo: 'bar' }]));
  });

  it('should return valid JSON in the body given an object', () => {
    expect(responseJSON(200, { foo: 'bar' })).toHaveProperty('body', JSON.stringify({ foo: 'bar' }));
  });

  it('should add arbitrary options', () => {
    expect(responseJSON(200, null, { foo: 'bar' })).toHaveProperty('foo', 'bar');
  });
});
