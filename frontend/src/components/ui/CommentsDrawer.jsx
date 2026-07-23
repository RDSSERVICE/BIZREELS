import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FiSend, FiTrash2, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useGetReelCommentsQuery,
  usePostCommentMutation,
  useDeleteCommentMutation,
} from '../../features/reels/reelsApi';
import { selectCurrentUser } from '../../features/auth/authSlice';
import Loader from '../common/Loader';
import Button from '../common/Button';

/**
 * Comments Drawer slide-up panel.
 */
const CommentsDrawer = ({
  isOpen,
  onClose,
  reelId,
}) => {
  const currentUser = useSelector(selectCurrentUser);
  const [commentText, setCommentText] = useState('');

  const { data: commentsRes, isLoading } = useGetReelCommentsQuery(
    { reelId },
    { skip: !isOpen || !reelId }
  );

  const [postComment, { isLoading: isPosting }] = usePostCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      await postComment({ reelId, content: commentText }).unwrap();
      setCommentText('');
      toast.success('Comment posted!');
    } catch (err) {
      toast.error('Failed to post comment.');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment({ commentId, reelId }).unwrap();
      toast.success('Comment deleted.');
    } catch (err) {
      toast.error('Failed to delete comment.');
    }
  };

  if (!isOpen) return null;

  const comments = commentsRes?.data || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        {/* Backdrop filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-brand-navy-dark/30 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Slide-up Container Card */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative z-10 w-full max-w-lg h-[65vh] bg-surface rounded-t-premium flex flex-col shadow-modal border-t border-border"
        >
          {/* Header Bar */}
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <span className="font-bold text-brand-navy text-sm">
              Comments ({comments.length})
            </span>
            <button
              onClick={onClose}
              className="p-1 hover:bg-surface-tertiary rounded-full transition-all text-text-secondary"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Comments Scroller */}
          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
            {isLoading ? (
              <div className="py-12 flex justify-center">
                <Loader size="sm" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-xs font-bold text-text-tertiary uppercase tracking-wider">No comments yet</p>
                <p className="text-[11px] text-text-tertiary mt-1">Be the first to share your thoughts!</p>
              </div>
            ) : (
              comments.map((comment) => {
                const isAuthor = comment.userId?._id === currentUser?._id;
                return (
                  <div key={comment._id} className="flex gap-3 items-start animate-fade-in group">
                    <img
                      src={comment.userId?.avatarUrl || 'https://via.placeholder.com/150'}
                      alt={comment.userId?.name}
                      className="w-8 h-8 rounded-full object-cover border border-border"
                    />
                    <div className="flex-1 flex flex-col bg-surface-secondary px-3 py-2 rounded-premium border border-border-light relative">
                      <span className="text-xs font-bold text-brand-navy flex items-center gap-1.5">
                        {comment.userId?.name}
                        {comment.userId?.activeRole && comment.userId?.activeRole !== 'customer' && (
                          <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-brand-purple/10 text-brand-purple rounded">
                            {comment.userId.activeRole}
                          </span>
                        )}
                      </span>
                      <p className="text-xs text-text-secondary mt-1 whitespace-pre-wrap">{comment.content}</p>
                      
                      {isAuthor && (
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="absolute right-2.5 top-2.5 p-1 text-text-tertiary hover:text-error hover:bg-error-light/30 rounded-md transition-all opacity-0 group-hover:opacity-100"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Form input dock */}
          <form onSubmit={handlePostComment} className="p-4 border-t border-border bg-surface-secondary flex gap-2 items-center">
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 px-4 py-2.5 text-xs bg-surface border border-border rounded-premium focus:outline-none focus:border-brand-purple text-brand-navy"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isPosting}
              disabled={!commentText.trim()}
              className="rounded-full !p-2.5 aspect-square"
            >
              <FiSend className="w-4 h-4" />
            </Button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CommentsDrawer;
