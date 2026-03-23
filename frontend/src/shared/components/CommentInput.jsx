import React, { useState } from 'react';
import { Send } from 'lucide-react';
import commentService from '../services/commentService.js';
import { useUI } from '../context/UIContext.jsx';
import './CommentInput.css';

/**
 * Component for adding new comments (Reviewer/Admin only)
 */
export const CommentInput = ({ taskItemId, userRole, onCommentAdded, onError }) => {
    const { language } = useUI();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const translations = {
        en: {
            placeholder: 'Add a comment explaining the issue...',
            submit: 'Send Comment',
            submitting: 'Sending...',
            emptyError: 'Comment cannot be empty',
            success: 'Comment added successfully',
            noPermission: 'You do not have permission to add comments'
        },
        vi: {
            placeholder: 'Thêm nhận xét giải thích vấn đề...',
            submit: 'Gửi nhận xét',
            submitting: 'Đang gửi...',
            emptyError: 'Nhận xét không được để trống',
            success: 'Đã thêm nhận xét',
            noPermission: 'Bạn không có quyền thêm nhận xét'
        }
    };

    const t = translations[language] || translations.en;

    // Only Reviewer and Admin can add comments
    if (userRole !== 'Reviewer' && userRole !== 'Admin') {
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const trimmedContent = content.trim();
        if (!trimmedContent) {
            if (onError) onError(t.emptyError);
            return;
        }

        setIsSubmitting(true);

        try {
            const newComment = await commentService.addComment(taskItemId, trimmedContent);
            setContent('');
            if (onCommentAdded) {
                onCommentAdded(newComment, t.success);
            }
        } catch (error) {
            if (onError) {
                onError(error.message);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyDown = (e) => {
        // Ctrl+Enter or Cmd+Enter to submit
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="comment-input">
            <form onSubmit={handleSubmit}>
                <textarea
                    className="form-control"
                    placeholder={t.placeholder}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSubmitting}
                    rows={3}
                    aria-label={t.placeholder}
                />
                <div className="comment-input-footer">
                    <small className="text-muted">
                        {language === 'vi' ? 'Ctrl+Enter để gửi nhanh' : 'Ctrl+Enter to send'}
                    </small>
                    <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={isSubmitting || !content.trim()}
                    >
                        {isSubmitting ? (
                            <>
                                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                {t.submitting}
                            </>
                        ) : (
                            <>
                                <Send size={16} className="me-1" />
                                {t.submit}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
