import responseJSON from '.';

describe('JSON response utility', () => {
  it('should add the expected status code', () => {
    expect(responseJSON(200)).toHaveProperty('statusCode', 200);
  });

  it('should add CORS headers', () => {
    expect(responseJSON(200)).toHaveProperty('headers.Access-Control-Allow-Origin', '*');
    expect(responseJSON(200)).toHaveProperty('headers.Access-Control-Allow-Credentials', true);
  });

  it('should add stringified JSON to the body', () => {
    expect(responseJSON(200, { foo: 'bar' })).toHaveProperty('body', JSON.stringify({ foo: 'bar' }));
  });

  it('should add non-objects to the body', () => {
    expect(responseJSON(200, 'foo')).toHaveProperty('body', 'foo');
  });

  it('should add arbitrary options', () => {
    expect(responseJSON(200, null, { foo: 'bar' })).toHaveProperty('foo', 'bar');
  });
});
