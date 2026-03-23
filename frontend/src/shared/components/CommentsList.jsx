import React, { useState, useEffect } from 'react';
import { MessageSquare, AlertCircle } from 'lucide-react';
import commentService from '../services/commentService.js';
import { formatRelativeTime } from '../utils/timeFormatter.js';
import { useUI } from '../context/UIContext.jsx';
import './CommentsList.css';

/**
 * Component to display list of comments for a task item
 */
export const CommentsList = ({ taskItemId, onCommentsLoaded }) => {
    const { language } = useUI();
    const [comments, setComments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const translations = {
        en: {
            title: 'Reviewer Comments',
            noComments: 'No comments yet',
            loadError: 'Failed to load comments',
            retry: 'Retry',
            reviewer: 'Reviewer',
            admin: 'Admin'
        },
        vi: {
            title: 'Nhận xét của Reviewer',
            noComments: 'Chưa có nhận xét nào',
            loadError: 'Không tải được nhận xét',
            retry: 'Thử lại',
            reviewer: 'Người đánh giá',
            admin: 'Quản trị viên'
        }
    };

    const t = translations[language] || translations.en;

    const loadComments = async () => {
        if (!taskItemId) {
            setComments([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await commentService.getComments(taskItemId);
            setComments(data);
            if (onCommentsLoaded) {
                onCommentsLoaded(data.length);
            }
        } catch (err) {
            setError(err.message);
            setComments([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadComments();
    }, [taskItemId]);

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'Reviewer':
                return 'badge-reviewer';
            case 'Admin':
                return 'badge-admin';
            default:
                return 'badge-default';
        }
    };

    const getRoleLabel = (role) => {
        if (role === 'Reviewer') return t.reviewer;
        if (role === 'Admin') return t.admin;
        return role;
    };

    if (isLoading) {
        return (
            <div className="comments-list">
                <div className="comments-header">
                    <MessageSquare size={18} />
                    <h4>{t.title}</h4>
                </div>
                <div className="comments-loading">
                    <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="comments-list">
                <div className="comments-header">
                    <MessageSquare size={18} />
                    <h4>{t.title}</h4>
                </div>
                <div className="comments-error">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                    <button className="btn btn-sm btn-outline-primary" onClick={loadComments}>
                        {t.retry}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="comments-list" aria-label={t.title}>
            <div className="comments-header">
                <MessageSquare size={18} />
                <h4>{t.title}</h4>
                {comments.length > 0 && (
                    <span className="comments-count">{comments.length}</span>
                )}
            </div>

            {comments.length === 0 ? (
                <div className="comments-empty">
                    <MessageSquare size={32} opacity={0.3} />
                    <p>{t.noComments}</p>
                </div>
            ) : (
                <div className="comments-body">
                    {comments.map((comment) => (
                        <div key={comment.id} className="comment-item">
                            <div className="comment-header">
                                <div className="comment-author">
                                    <span className="author-name">{comment.authorName}</span>
                                    <span className={`role-badge ${getRoleBadgeClass(comment.authorRole)}`}>
                                        {getRoleLabel(comment.authorRole)}
                                    </span>
                                </div>
                                <span className="comment-time">
                                    {formatRelativeTime(comment.createdAt, language)}
                                </span>
                            </div>
                            <div className="comment-content">
                                {comment.content}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
