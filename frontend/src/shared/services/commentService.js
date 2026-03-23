import api from '../utils/api.js';

/**
 * Service for comment operations
 */
const commentService = {
    /**
     * Get all comments for a task item
     * @param {number} taskItemId - Task item ID
     * @returns {Promise<Array>} Array of comments
     */
    async getComments(taskItemId) {
        try {
            const response = await api.get(`/task-items/${taskItemId}/comments`);
            return response.data || [];
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Add a new comment to a task item
     * @param {number} taskItemId - Task item ID
     * @param {string} content - Comment content
     * @returns {Promise<Object>} Created comment
     */
    async addComment(taskItemId, content) {
        try {
            const response = await api.post(`/task-items/${taskItemId}/comments`, {
                content: content.trim()
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    },

    /**
     * Handle API errors and return user-friendly messages
     * @param {Error} error - Axios error
     * @returns {Error} Formatted error
     */
    handleError(error) {
        if (!error.response) {
            return new Error('Không thể kết nối đến server');
        }

        const status = error.response.status;
        const message = error.response.data?.message;

        switch (status) {
            case 401:
                return new Error('Phiên đăng nhập đã hết hạn');
            case 403:
                return new Error('Bạn không có quyền truy cập');
            case 404:
                return new Error('Không tìm thấy task item');
            case 500:
                return new Error('Lỗi hệ thống, vui lòng thử lại sau');
            default:
                return new Error(message || 'Đã xảy ra lỗi');
        }
    }
};

export default commentService;
