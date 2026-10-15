test('the deployment-gate demo is disabled unless explicitly requested', () => {
  expect(process.env.DEMONSTRATE_TEST_FAILURE).not.toBe('true');
});
