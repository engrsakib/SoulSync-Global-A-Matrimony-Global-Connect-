'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@soulsync/ui/card';
import type {
  CommunityMemberRoleDto,
  CommunityPostDto,
  CommunityReactionKindDto,
  ReactionSummaryDto,
} from '@soulsync/shared-types/communities';
import { canModerateCommunity } from '@soulsync/shared-types/communities';
import { AuthorLine } from './author-line';
import { CommentThread } from './comment-thread';
import { PostEngagementBar } from './post-engagement-bar';
import { formatCommunityPostTimestamp } from '@/lib/communities-format';
import { Button } from '@soulsync/ui/button';
import { decideCommunityPost } from '@/lib/communities-client';
import { toast } from 'sonner';
import { CommunityPostActionsMenu } from './community-post-actions-menu';
import { CommunityPostBody } from './community-post-body';

type CommunityPostCardProps = {
  post: CommunityPostDto;
  slug: string;
  canModerate?: boolean;
  moderationMode?: boolean;
  viewerUserId?: string | null;
  viewerUsername?: string | null;
  viewerRole?: CommunityMemberRoleDto | null;
  onDecided?: (post: CommunityPostDto) => void;
  onPostUpdate?: (
    postId: string,
    patch: Partial<CommunityPostDto> | ((post: CommunityPostDto) => CommunityPostDto),
  ) => void;
  onPostRemoved?: (postId: string) => void;
  readOnlySocial?: boolean;
};

export function CommunityPostCard({
  post,
  slug,
  canModerate,
  moderationMode,
  onDecided,
  onPostUpdate,
  onPostRemoved,
  viewerUserId,
  viewerUsername,
  viewerRole,
  readOnlySocial,
}: CommunityPostCardProps) {
  const knowsViewer = Boolean(viewerUserId || viewerUsername);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const commentExpandRef = useRef<(() => void) | null>(null);
  const registerCommentExpand = useCallback((fn: () => void) => {
    commentExpandRef.current = fn;
  }, []);
  const { relative, absolute } = formatCommunityPostTimestamp(post.publishedAt ?? post.createdAt);
  const time =
    relative && absolute ? `${relative} · ${absolute}` : relative || absolute || undefined;
  const statusMeta =
    post.status === 'PENDING'
      ? 'Pending review'
      : post.status === 'REJECTED'
        ? 'Rejected'
        : undefined;

  async function handleDecide(decision: 'approve' | 'reject') {
    try {
      const updated = await decideCommunityPost(slug, post.id, { decision });
      toast.success(decision === 'approve' ? 'Post approved' : 'Post rejected');
      onDecided?.(updated);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Action failed');
    }
  }

  return (
    <Card className="border-[var(--border)]/80 shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="relative">
          <AuthorLine
            author={post.author}
            communitySlug={slug}
            timestamp={time}
            meta={statusMeta}
            className="min-w-0 pr-10"
          />
          {knowsViewer ? (
            <div className="absolute top-0 right-0">
              <CommunityPostActionsMenu
                slug={slug}
                post={post}
                viewerUserId={viewerUserId}
                viewerUsername={viewerUsername}
                viewerRole={viewerRole}
                onPostUpdate={(updated) => onPostUpdate?.(post.id, updated)}
                onPostRemoved={onPostRemoved}
              />
            </div>
          ) : null}
        </div>
        {post.bodyText ? <CommunityPostBody bodyText={post.bodyText} communitySlug={slug} /> : null}
        {post.images.length > 0 ? (
          <div
            className={
              post.images.length === 1
                ? 'overflow-hidden rounded-xl'
                : 'grid grid-cols-2 gap-1 overflow-hidden rounded-xl'
            }
          >
            {post.images.map((img) => (
              <div key={img.id} className="relative aspect-[4/3] bg-[var(--muted)]">
                <Image src={img.url} alt="" fill className="object-cover" sizes="400px" />
              </div>
            ))}
          </div>
        ) : null}

        {moderationMode && canModerate && post.status === 'PENDING' ? (
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={() => void handleDecide('approve')}>
              Approve
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void handleDecide('reject')}
            >
              Reject
            </Button>
          </div>
        ) : null}

        {!readOnlySocial && post.status === 'PUBLISHED' ? (
          <>
            <PostEngagementBar
              slug={slug}
              postId={post.id}
              shareToken={post.shareToken}
              reactionSummary={post.reactionSummary}
              viewerReaction={post.viewerReaction}
              onCommentClick={() => {
                setCommentsOpen(true);
                commentExpandRef.current?.();
              }}
              onReactionChange={(next: {
                reactionSummary: ReactionSummaryDto[];
                viewerReaction: CommunityReactionKindDto | null;
              }) => {
                onPostUpdate?.(post.id, {
                  reactionSummary: next.reactionSummary,
                  viewerReaction: next.viewerReaction,
                });
              }}
            />
            <CommentThread
              slug={slug}
              postId={post.id}
              initialCount={post.commentCount}
              expanded={commentsOpen}
              onExpandedChange={setCommentsOpen}
              registerExpand={registerCommentExpand}
              onCommentAdded={() => {
                onPostUpdate?.(post.id, (current) => ({
                  ...current,
                  commentCount: current.commentCount + 1,
                }));
              }}
            />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function viewerCanModerate(
  membership: { role: string; status: string } | null | undefined,
): boolean {
  if (!membership || membership.status !== 'ACTIVE') {
    return false;
  }
  return canModerateCommunity(membership.role as Parameters<typeof canModerateCommunity>[0]);
}
