import { viewerMatchesDiscoveryReligionAudience } from '../biodata-discovery-settings';
import type { Religion } from '../partner-preference';
import type { CompatibilityEligibilityResult, CompatibilityParticipantSnapshot } from './types';
import { resolveOppositeGender } from './utils';

export type CompatibilityEligibilityContext = {
  viewerUserId: string;
  targetUserId: string;
  /** When true, skip discoverability check (viewer viewing self). */
  isSelfView?: boolean;
  /** When true, skip religion audience (e.g. accepted proposal). */
  bypassDiscoveryReligion?: boolean;
  /** When true, skip isDiscoverable check. */
  bypassDiscoverability?: boolean;
};

export function assertCompatibilityEligibility(
  viewer: CompatibilityParticipantSnapshot,
  target: CompatibilityParticipantSnapshot,
  context: CompatibilityEligibilityContext,
): CompatibilityEligibilityResult {
  if (viewer.deletedAt) {
    return { eligible: false, reason: 'Your account is not active.' };
  }
  if (target.deletedAt) {
    return { eligible: false, reason: 'Member is not available.' };
  }
  if (viewer.tenantId !== target.tenantId) {
    return { eligible: false, reason: 'Members are not in the same community.' };
  }
  if (context.viewerUserId === context.targetUserId) {
    return { eligible: false, reason: 'Compatibility is not calculated for your own profile.' };
  }
  if (viewer.profile.gender === target.profile.gender) {
    return { eligible: false, reason: 'Compatibility requires opposite gender profiles.' };
  }

  const expectedForViewer = resolveOppositeGender(viewer.profile.gender);
  if (target.profile.gender !== expectedForViewer) {
    return { eligible: false, reason: 'This profile does not match your gender preference.' };
  }

  if (!viewer.partnerPreference?.isActive || !viewer.myPreference?.isActive) {
    return { eligible: false, reason: 'Complete your partner preferences to see compatibility.' };
  }
  if (!target.partnerPreference?.isActive || !target.myPreference?.isActive) {
    return { eligible: false, reason: 'This member has not completed matching preferences.' };
  }

  if (viewer.partnerPreference.preferredGender !== target.profile.gender) {
    return { eligible: false, reason: 'This profile does not match your gender preference.' };
  }
  if (target.partnerPreference.preferredGender !== viewer.profile.gender) {
    return { eligible: false, reason: 'You do not match this member’s gender preference.' };
  }

  if (!context.bypassDiscoverability && !context.isSelfView && !target.profile.isDiscoverable) {
    return { eligible: false, reason: 'This member is not discoverable.' };
  }

  if (!context.bypassDiscoveryReligion && !context.isSelfView) {
    const viewerReligion: Religion = viewer.profile.religion;
    const allowed = viewerMatchesDiscoveryReligionAudience(viewerReligion, {
      religion: target.profile.religion,
      discoveryReligionMode: target.profile.discoveryReligionMode,
      discoveryReligionAllowList: target.profile.discoveryReligionAllowList,
    });
    if (!allowed) {
      return {
        eligible: false,
        reason: 'This member limits who can view compatibility based on religion settings.',
      };
    }
  }

  const minComplete = viewer.partnerPreference.minProfileCompleteness ?? 0;
  if (target.profile.completenessScore < minComplete) {
    return {
      eligible: false,
      reason: 'This member’s profile does not meet your minimum completeness requirement.',
    };
  }

  return { eligible: true };
}
