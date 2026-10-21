import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  CommunityCommentDto,
  CommunityDto,
  CommunityFeedDto,
  CommunityJoinRequestDto,
  CommunityMemberDto,
  CommunityMemberPostsDto,
  CommunityPostDto,
  CreateCommunityCommentDto,
  CreateCommunityDto,
  CreateCommunityJoinRequestDto,
  CreateCommunityPostDto,
  DecideCommunityJoinRequestDto,
  DecideCommunityPostDto,
  PatchCommunityDto,
  PatchCommunityMemberDto,
  PatchCommunityPostDto,
  SetCommunityReactionDto,
} from '@soulsync/shared-types/communities';
import { ApiCommonErrors, ApiWrappedOkResponse } from '../common/swagger';
import { JwtAuthGuard, type AuthenticatedJwtRequest } from '../auth/jwt-auth.guard';
import { CommunitiesService } from './communities.service';
import { CommunityCommentsService } from './community-comments.service';
import { CommunityJoinRequestsService } from './community-join-requests.service';
import { CommunityMembersService } from './community-members.service';
import { CommunityPostsService } from './community-posts.service';
import { CommunityReactionsService } from './community-reactions.service';

@ApiTags('communities')
@ApiBearerAuth()
@Controller('communities')
@UseGuards(JwtAuthGuard)
export class CommunitiesController {
  constructor(
    private readonly communitiesService: CommunitiesService,
    private readonly joinRequestsService: CommunityJoinRequestsService,
    private readonly membersService: CommunityMembersService,
    private readonly postsService: CommunityPostsService,
    private readonly commentsService: CommunityCommentsService,
    private readonly reactionsService: CommunityReactionsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List member communities in the current tenant' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  list(@Req() request: AuthenticatedJwtRequest): Promise<CommunityDto[]> {
    return this.communitiesService.listForUser(request.userId!);
  }

  @Post()
  @ApiOperation({ summary: 'Create a member community' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  create(
    @Req() request: AuthenticatedJwtRequest,
    @Body() body: CreateCommunityDto,
  ): Promise<CommunityDto> {
    return this.communitiesService.create(request.userId!, body);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Community detail' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  detail(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
  ): Promise<CommunityDto> {
    return this.communitiesService.getDetail(request.userId!, slug);
  }

  @Patch(':slug')
  @ApiOperation({ summary: 'Update community settings (admin)' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  patch(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
    @Body() body: PatchCommunityDto,
  ): Promise<CommunityDto> {
    return this.communitiesService.patch(request.userId!, slug, body);
  }

  @Delete(':slug')
  @ApiOperation({ summary: 'Soft-delete community (owner)' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  remove(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
  ): Promise<CommunityDto> {
    return this.communitiesService.softDelete(request.userId!, slug);
  }

  @Post(':slug/join')
  @ApiOperation({ summary: 'Join or request to join a community' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  join(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
    @Body() body: CreateCommunityJoinRequestDto,
  ): Promise<CommunityDto | CommunityJoinRequestDto> {
    return this.joinRequestsService.join(request.userId!, slug, body);
  }

  @Get(':slug/join-requests')
  @ApiOperation({ summary: 'Pending join requests (moderators)' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  listJoinRequests(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
  ): Promise<CommunityJoinRequestDto[]> {
    return this.joinRequestsService.listPending(request.userId!, slug);
  }

  @Post(':slug/join-requests/:id/decide')
  @ApiOperation({ summary: 'Approve or deny a join request' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  decideJoinRequest(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
    @Param('id') id: string,
    @Body() body: DecideCommunityJoinRequestDto,
  ): Promise<CommunityJoinRequestDto> {
    return this.joinRequestsService.decide(request.userId!, slug, id, body);
  }

  @Get(':slug/members/search')
  @ApiOperation({ summary: 'Search active members by username prefix' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  searchMembers(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
    @Query('q') q?: string,
  ): Promise<CommunityMemberDto[]> {
    return this.membersService.searchByUsername(request.userId!, slug, q ?? '');
  }

  @Get(':slug/members/:username/posts')
  @ApiOperation({ summary: 'Published posts by a member in this community' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  memberPosts(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
    @Param('username') username: string,
    @Query('cursor') cursor?: string,
  ): Promise<CommunityMemberPostsDto> {
    return this.membersService.listMemberPosts(request.userId!, slug, username, cursor);
  }

  @Get(':slug/members/:username')
  @ApiOperation({ summary: 'Member profile card by username' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  memberCard(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
    @Param('username') username: string,
  ): Promise<CommunityMemberDto> {
    return this.membersService.getMemberCard(request.userId!, slug, username);
  }

  @Get(':slug/members')
  @ApiOperation({ summary: 'List active members' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  listMembers(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
  ): Promise<CommunityMemberDto[]> {
    return this.membersService.listMembers(request.userId!, slug);
  }

  @Patch(':slug/members/:userId')
  @ApiOperation({ summary: 'Update member role or trusted poster flag' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  patchMember(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
    @Param('userId') userId: string,
    @Body() body: PatchCommunityMemberDto,
  ): Promise<CommunityMemberDto> {
    return this.membersService.patchMember(request.userId!, slug, userId, body);
  }

  @Post(':slug/members/:userId/block')
  @ApiOperation({ summary: 'Block a member' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  blockMember(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
    @Param('userId') userId: string,
  ): Promise<CommunityMemberDto> {
    return this.membersService.blockMember(request.userId!, slug, userId);
  }

  @Post(':slug/members/:userId/remove')
  @ApiOperation({ summary: 'Remove a member' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  removeMember(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
    @Param('userId') userId: string,
  ): Promise<CommunityMemberDto> {
    return this.membersService.removeMember(request.userId!, slug, userId);
  }

  @Get(':slug/posts')
  @ApiOperation({ summary: 'Community feed or moderation queue' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  listPosts(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('moderationQueue') moderationQueue?: string,
  ): Promise<CommunityFeedDto> {
    const parsedLimit = limit !== undefined ? Number.parseInt(limit, 10) : undefined;
    return this.postsService.listFeed(request.userId!, slug, {
      cursor,
      limit: Number.isFinite(parsedLimit) ? parsedLimit : undefined,
      moderationQueue: moderationQueue === 'true',
    });
  }

  @Post(':slug/posts')
  @ApiOperation({ summary: 'Create a post' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  createPost(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
    @Body() body: CreateCommunityPostDto,
  ): Promise<CommunityPostDto> {
    return this.postsService.createPost(request.userId!, slug, body);
  }

  @Post(':slug/posts/:postId/decide')
  @ApiOperation({ summary: 'Approve or reject a pending post' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  decidePost(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
    @Param('postId') postId: string,
    @Body() body: DecideCommunityPostDto,
  ): Promise<CommunityPostDto> {
    return this.postsService.decidePost(request.userId!, slug, postId, body);
  }

  @Patch(':slug/posts/:postId')
  @ApiOperation({ summary: 'Edit a post (author or moderator)' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  patchPost(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
    @Param('postId') postId: string,
    @Body() body: PatchCommunityPostDto,
  ): Promise<CommunityPostDto> {
    return this.postsService.patchPost(request.userId!, slug, postId, body);
  }

  @Delete(':slug/posts/:postId')
  @ApiOperation({ summary: 'Soft-delete a post' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  deletePost(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
    @Param('postId') postId: string,
  ): Promise<CommunityPostDto> {
    return this.postsService.deletePost(request.userId!, slug, postId);
  }

  @Get(':slug/posts/:postId/comments')
  @ApiOperation({ summary: 'List comments on a post' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  listComments(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
    @Param('postId') postId: string,
    @Query('cursor') cursor?: string,
  ): Promise<{ items: CommunityCommentDto[]; nextCursor: string | null }> {
    return this.commentsService.listComments(request.userId!, slug, postId, cursor);
  }

  @Post(':slug/posts/:postId/comments')
  @ApiOperation({ summary: 'Add a comment' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  createComment(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
    @Param('postId') postId: string,
    @Body() body: CreateCommunityCommentDto,
  ): Promise<CommunityCommentDto> {
    return this.commentsService.createComment(request.userId!, slug, postId, body);
  }

  @Put(':slug/posts/:postId/reactions')
  @ApiOperation({ summary: 'Set reaction on a post' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async setPostReaction(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
    @Param('postId') postId: string,
    @Body() body: SetCommunityReactionDto,
  ): Promise<{ ok: true }> {
    await this.reactionsService.setPostReaction(request.userId!, slug, postId, body);
    return { ok: true };
  }

  @Delete(':slug/posts/:postId/reactions')
  @ApiOperation({ summary: 'Clear reaction on a post' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async clearPostReaction(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
    @Param('postId') postId: string,
  ): Promise<{ ok: true }> {
    await this.reactionsService.clearPostReaction(request.userId!, slug, postId);
    return { ok: true };
  }

  @Put(':slug/posts/:postId/comments/:commentId/reactions')
  @ApiOperation({ summary: 'Set reaction on a comment' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async setCommentReaction(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
    @Body() body: SetCommunityReactionDto,
  ): Promise<{ ok: true }> {
    await this.reactionsService.setCommentReaction(
      request.userId!,
      slug,
      postId,
      commentId,
      body,
    );
    return { ok: true };
  }

  @Delete(':slug/posts/:postId/comments/:commentId/reactions')
  @ApiOperation({ summary: 'Clear reaction on a comment' })
  @ApiWrappedOkResponse(Object)
  @ApiCommonErrors()
  async clearCommentReaction(
    @Req() request: AuthenticatedJwtRequest,
    @Param('slug') slug: string,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
  ): Promise<{ ok: true }> {
    await this.reactionsService.clearCommentReaction(
      request.userId!,
      slug,
      postId,
      commentId,
    );
    return { ok: true };
  }
}
