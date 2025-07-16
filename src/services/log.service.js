import { Log } from '../api/models/log.model.js';

/**
 * Creates a new log entry in the database.
 * @param {object} options - The options for the log entry.
 * @param {string} options.user - The ID of the user who performed the action.
 * @param {string} options.action - The type of action performed (e.g., 'USER_LOGIN').
 * @param {string} options.details - A human-readable description of the event.
 * @param {object} [options.entity] - Optional related entity.
 * @param {string} options.entity.id - The ID of the related document.
 * @param {string} options.entity.model - The name of the model for the related document.
 */
export const createLog = async ({ user, action, details, entity }) => {
    try {
        await Log.create({ user, action, details, entity });
    } catch (error) {
        // We don't want a logging failure to crash the main operation.
        // In a production system, you'd log this error to a separate monitoring service.
        console.error("Failed to create log entry:", error);
    }
};