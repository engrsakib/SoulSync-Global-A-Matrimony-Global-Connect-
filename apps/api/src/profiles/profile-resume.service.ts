import { Injectable } from '@nestjs/common';
import type { ProfileResumeDto } from '@soulsync/shared-types';
import { memberBiodataLinkPath } from '../activity-log/activity-log.builder';
import { ActivityLogRecorder } from '../activity-log/activity-log.recorder';
import { activityLogUserSelect } from '../activity-log/activity-log-user-label.service';
import { BiodataViewService } from '../biodata/biodata-view.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { redactResumeSections } from './resume-field-redaction';

@Injectable()
export class ProfileResumeService {
  constructor(
    private readonly biodataView: BiodataViewService,
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
    private readonly activityLog: ActivityLogRecorder,
  ) {}

  async getResume(viewerUserId: string, targetUserId: string): Promise<ProfileResumeDto> {
    const view = await this.biodataView.getMemberViewForTargetUserId(viewerUserId, targetUserId);
    const { sections, contactsApplied } = redactResumeSections(view.sections);

    void this.recordAudit(viewerUserId, targetUserId).catch(() => {
      /* ignore audit failures */
    });
    void this.recordBiodataViewActivity(viewerUserId, targetUserId).catch(() => {
      /* ignore activity log failures */
    });

    return {
      ...view,
      sections,
      redaction: { contactsApplied },
    };
  }

  private async recordBiodataViewActivity(
    viewerUserId: string,
    targetUserId: string,
  ): Promise<void> {
    if (viewerUserId === targetUserId) {
      return;
    }
    const [viewer, owner] = await Promise.all([
      this.prisma.client.user.findUnique({
        where: { id: viewerUserId },
        select: activityLogUserSelect,
      }),
      this.prisma.client.user.findUnique({
        where: { id: targetUserId },
        select: activityLogUserSelect,
      }),
    ]);
    if (!viewer || !owner) {
      return;
    }
    this.activityLog.biodataViewed(viewer, owner, memberBiodataLinkPath(owner.username));
  }

  private async recordAudit(viewerUserId: string, targetUserId: string): Promise<void> {
    const day = new Date().toISOString().slice(0, 10);
    const key = `resume:audit:${viewerUserId}:${targetUserId}:${day}`;
    if (this.redis.client.status === 'wait') {
      await this.redis.client.connect();
    }
    await this.redis.client.incr(key);
    await this.redis.client.expire(key, 86_400 * 8);
  }
}
