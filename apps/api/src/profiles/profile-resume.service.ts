import { Injectable } from '@nestjs/common';
import type { ProfileResumeDto } from '@soulsync/shared-types';
import { BiodataViewService } from '../biodata/biodata-view.service';
import { RedisService } from '../redis/redis.service';
import { redactResumeSections } from './resume-field-redaction';

@Injectable()
export class ProfileResumeService {
  constructor(
    private readonly biodataView: BiodataViewService,
    private readonly redis: RedisService,
  ) {}

  async getResume(viewerUserId: string, targetUserId: string): Promise<ProfileResumeDto> {
    const view = await this.biodataView.getMemberViewForTargetUserId(viewerUserId, targetUserId);
    const { sections, contactsApplied } = redactResumeSections(view.sections);

    void this.recordAudit(viewerUserId, targetUserId).catch(() => {
      /* ignore audit failures */
    });

    return {
      ...view,
      sections,
      redaction: { contactsApplied },
    };
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
