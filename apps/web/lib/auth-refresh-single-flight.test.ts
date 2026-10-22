import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resetRefreshSingleFlightForTests,
  runKeyedSingleFlight,
} from './auth-refresh-single-flight';

void test('runKeyedSingleFlight coalesces concurrent calls for the same key', async () => {
  resetRefreshSingleFlightForTests();
  let calls = 0;
  const task = () =>
    new Promise<string>((resolve) => {
      calls += 1;
      setTimeout(() => resolve('ok'), 25);
    });

  const [first, second] = await Promise.all([
    runKeyedSingleFlight('refresh-a', task),
    runKeyedSingleFlight('refresh-a', task),
  ]);

  assert.equal(calls, 1);
  assert.equal(first, 'ok');
  assert.equal(second, 'ok');
});

void test('runKeyedSingleFlight runs separately for different keys', async () => {
  resetRefreshSingleFlightForTests();
  let calls = 0;
  const task = () => {
    calls += 1;
    return Promise.resolve('done');
  };

  await Promise.all([runKeyedSingleFlight('key-1', task), runKeyedSingleFlight('key-2', task)]);

  assert.equal(calls, 2);
});
