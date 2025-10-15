'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { postsService } from '@/lib/services/posts.service';
import { PostDetailResponse, CommentNode } from '@/lib/types/posts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Heart,
  MessageCircle,
  Calendar,
  User,
  ArrowLeft,
  Send,
  ThumbsUp,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [postDetail, setPostDetail] = useState<PostDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; author: string } | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchPostDetail = async () => {
      try {
        setLoading(true);
        const data = await postsService.getPostBySlug(slug);
        setPostDetail(data);
      } catch (error) {
        console.error('Failed to fetch post detail:', error);
        toast.error('Không thể tải bài viết');
        router.push('/posts');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPostDetail();
    }
  }, [slug, router]);

  const handleLikePost = async () => {
    if (!postDetail) return;

    try {
      if (postDetail.likedByViewer) {
        const result = await postsService.unlikePost(postDetail.post.id);
        setPostDetail({
          ...postDetail,
          likedByViewer: false,
          post: {
            ...postDetail.post,
            likesCount: result.likesCount || postDetail.post.likesCount - 1,
          },
        });
        toast.success('Đã bỏ thích bài viết');
      } else {
        const result = await postsService.likePost(postDetail.post.id);
        setPostDetail({
          ...postDetail,
          likedByViewer: true,
          post: {
            ...postDetail.post,
            likesCount: result.likesCount || postDetail.post.likesCount + 1,
          },
        });
        toast.success('Đã thích bài viết');
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Vui lòng đăng nhập để thích bài viết');
      } else {
        toast.error('Không thể thực hiện thao tác');
      }
    }
  };

  const handleSubmitComment = async () => {
    if (!postDetail || !commentContent.trim()) return;

    try {
      setSubmittingComment(true);
      const newComment = await postsService.createComment(postDetail.post.id, {
        content: commentContent.trim(),
        parentId: replyTo?.id,
      });

      // Refresh post detail to get updated comments
      const updatedDetail = await postsService.getPostBySlug(slug);
      setPostDetail(updatedDetail);
      setCommentContent('');
      setReplyTo(null);
      toast.success('Đã thêm bình luận');
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Vui lòng đăng nhập để bình luận');
      } else {
        toast.error('Không thể thêm bình luận');
      }
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await postsService.likeComment(commentId);
      // Refresh to get updated comment likes
      const updatedDetail = await postsService.getPostBySlug(slug);
      setPostDetail(updatedDetail);
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Vui lòng đăng nhập để thích bình luận');
      }
    }
  };

  const handleReply = (commentId: string, authorName: string) => {
    setReplyTo({ id: commentId, author: authorName });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-24 mb-6" />
        <Skeleton className="h-12 w-3/4 mb-4" />
        <Skeleton className="h-6 w-1/2 mb-8" />
        <Skeleton className="h-96 w-full mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!postDetail) {
    return null;
  }

  const { post, likedByViewer, comments } = postDetail;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link href="/posts">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại danh sách
          </Button>
        </Link>

        {/* Post Header */}
        <article>
          <header className="mb-8">
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

            {post.summary && (
              <p className="text-xl text-muted-foreground mb-6">{post.summary}</p>
            )}

            {/* Meta information */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDate(post.createdAt)}
              </span>
              {post.author && (
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {post.author.name || post.author.adminCode}
                </span>
              )}
              <span className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                {post.likesCount} lượt thích
              </span>
              <span className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                {post.commentsCount} bình luận
              </span>
            </div>

            {/* Categories */}
            {post.categories && post.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.categories.map((category) => (
                  <Badge key={category.id} variant="secondary">
                    {category.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Series */}
            {post.series && post.series.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-semibold mb-2">Series:</p>
                <div className="flex flex-wrap gap-2">
                  {post.series.map((s) => (
                    <Badge key={s.id} variant="default">
                      {s.name}
                      {s.order !== null && ` (Phần ${s.order})`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </header>

          {/* Cover Image */}
          {post.coverImage && (
            <div className="relative w-full h-96 mb-8 rounded-lg overflow-hidden">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: post.content || '' }}
          />

          {/* Like button */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant={likedByViewer ? 'default' : 'outline'}
              onClick={handleLikePost}
              className="gap-2"
            >
              <Heart className={`h-4 w-4 ${likedByViewer ? 'fill-current' : ''}`} />
              {likedByViewer ? 'Đã thích' : 'Thích'} ({post.likesCount})
            </Button>
          </div>

          <Separator className="my-8" />

          {/* Comments Section */}
          <section>
            <h2 className="text-2xl font-bold mb-6">
              Bình luận ({post.commentsCount})
            </h2>

            {/* Comment Form */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">
                  {replyTo ? `Trả lời ${replyTo.author}` : 'Viết bình luận'}
                </CardTitle>
                {replyTo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyTo(null)}
                  >
                    Hủy trả lời
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Nhập bình luận của bạn..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  rows={4}
                  className="mb-4"
                />
                <Button
                  onClick={handleSubmitComment}
                  disabled={!commentContent.trim() || submittingComment}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {submittingComment ? 'Đang gửi...' : 'Gửi bình luận'}
                </Button>
              </CardContent>
            </Card>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onLike={handleLikeComment}
                  onReply={handleReply}
                />
              ))}

              {comments.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}

// Comment Item Component
interface CommentItemProps {
  comment: CommentNode;
  onLike: (commentId: string) => void;
  onReply: (commentId: string, authorName: string) => void;
  level?: number;
}

function CommentItem({ comment, onLike, onReply, level = 0 }: CommentItemProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`${level > 0 ? 'ml-8 border-l-2 pl-4' : ''}`}>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar>
              <AvatarImage src={comment.author?.avatar || undefined} />
              <AvatarFallback>
                {comment.author?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">
                  {comment.author?.name || 'Người dùng ẩn danh'}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                </span>
                {comment.isEdited && (
                  <Badge variant="outline" className="text-xs">
                    Đã chỉnh sửa
                  </Badge>
                )}
              </div>

              <p className="text-sm mb-3 whitespace-pre-wrap">{comment.content}</p>

              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLike(comment.id)}
                  className={`gap-2 ${
                    comment.likedByViewer ? 'text-primary' : ''
                  }`}
                >
                  <ThumbsUp
                    className={`h-3 w-3 ${
                      comment.likedByViewer ? 'fill-current' : ''
                    }`}
                  />
                  {comment.likeCount}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    onReply(comment.id, comment.author?.name || 'người dùng')
                  }
                  className="gap-2"
                >
                  <MessageCircle className="h-3 w-3" />
                  Trả lời
                </Button>

                {comment.replyCount > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {comment.replyCount} phản hồi
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onLike={onLike}
              onReply={onReply}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

