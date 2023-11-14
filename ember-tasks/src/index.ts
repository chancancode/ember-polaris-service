export { type Task } from './task.ts';
export {
  type AbortOptions,
  abort,
  resolve,
  reject,
  promise,
  run,
} from './helpers.ts';

import { abort, resolve, reject, promise, run } from './helpers.ts';

const Task = {
  abort,
  resolve,
  reject,
  promise,
  run,
};

Object.freeze(Task);

export default Task;
