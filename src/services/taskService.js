import { request } from './api';

/**
 * Get tasks
 * @returns {Promise<Array>} List of tasks
 */
export async function getTasks() {
  return request('/task', {
    method: 'GET',
  });
}

/**
 * Create a new task
 * @param {Object} task - Task data
 * @returns {Promise<Object>} Created task
 */
export async function createTask(task) {
  return request('/task', {
    method: 'POST',
    body: JSON.stringify(task),
  });
}
