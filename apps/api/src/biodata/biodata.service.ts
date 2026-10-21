import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Gender,
  Prisma,
  Religion as PrismaReligion,
  type MyPreference,
  type PartnerPreference,
  type Profile,
} from '@soulsync/db';
import type { BiodataMeDto, BiodataSectionId } from '@soulsync/shared-types/biodata';
import {
  BIODATA_SECTION_IDS,
  LOCATION_DETAILS_MAX_WORDS,
  validateProfileLocationDetails,
} from '@soulsync/shared-types/biodata';
import {
  BLOOD_GROUP_VALUES,
  COMPLEXION_SELF_VALUES,
  type Religion,
} from '@soulsync/shared-types/partner-preference';
import {
  mergePartnerCustomExpectations,
  validatePartnerCustomExpectationsNotes,
} from '@soulsync/shared-types/partner-preferences-ui';
import type { CustomExpectations } from '@soulsync/shared-types/partner-preference';
import {
  FAMILY_ECONOMIC_CLASS_VALUES,
  FAMILY_HERITAGE_MAX_RELATIVES,
  parseFamilyRelatives,
  validateFamilyHeritageTextFields,
} from '@soulsync/shared-types/family-heritage';
import {
  CLOTHING_ABOVE_ANKLES_VALUES,
  HIJAB_PURDAH_VALUES,
  ISLAM_SHARIA_TEXT_MAX_WORDS,
  MAHRAM_COMPLIANCE_VALUES,
  PRAYER_REGULARITY_VALUES,
  QURAN_RECITATION_LEVEL_VALUES,
  SUNNAH_BEARD_STATUS_VALUES,
  validateIslamShariaTextFields,
} from '@soulsync/shared-types/islam-sharia';
import {
  allowedBranchCodes,
  getReligionBranchOptions,
  ISLAM_MASLAK_VALUES,
  isIslamMadhabCode,
  usesIslamMadhabField,
  validateFaithSectionRequired,
} from '@soulsync/shared-types/religion-branches';
import {
  areRequiredMarriagePledgesComplete,
  normalizeGuardianContactMessagingForSave,
  normalizeGuardianContactPhonesForSave,
  validateGuardianContactSection,
  type MarriagePledgeState,
} from '@soulsync/shared-types/guardian-contact';
import { isGuestPlaceholderEmail } from '@soulsync/shared-types';
import { FieldEncryptionService } from '../crypto/field-encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CUSTOM_EXPECTATIONS_MAX_BYTES,
  getAgeRangeError,
  getHeightRangeError,
  getIncomeRangeError,
  resolvePreferredGender,
} from '../partner-preferences/partner-preference.rules';
import { computeBiodataCompleteness } from './biodata-completeness';
import {
  readOptionalBooleanNull,
  readOptionalBoundedInt,
  readOptionalStringField,
  readOptionalStringFieldMaxWords,
  readStringField,
} from './biodata-body.util';
import { buildLegacyEducationSummary } from './education-career.util';
import type {
  MyPreferenceWritePayload,
  PartnerPreferenceWritePayload,
} from './biodata-write.types';
import {
  encryptMyPreferenceForStorage,
  encryptPartnerPreferenceForStorage,
  encryptProfileForStorage,
  toBiodataMeDto,
} from './biodata.mapper';

const PROFILE_STUB_DOB = new Date('1990-01-01T00:00:00.000Z');

@Injectable()
export class BiodataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: FieldEncryptionService,
  ) {}

  async getMine(userId: string): Promise<BiodataMeDto> {
    const bundle = await this.loadBundle(userId);
    const accountEmail = await this.resolveAccountEmail(userId);
    return toBiodataMeDto(
      this.crypto,
      bundle.profile,
      bundle.myPreference,
      bundle.partnerPreference,
      accountEmail,
    );
  }

  private async resolveAccountEmail(userId: string): Promise<string | null> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });
    if (!user || isGuestPlaceholderEmail(user.email)) {
      return null;
    }
    return user.email;
  }

  async patchSection(
    userId: string,
    sectionId: string,
    body: Record<string, unknown>,
  ): Promise<BiodataMeDto> {
    if (!BIODATA_SECTION_IDS.includes(sectionId as BiodataSectionId)) {
      throw new BadRequestException(`Unknown biodata section: ${sectionId}`);
    }

    const profile = await this.requireProfile(userId);

    switch (sectionId as BiodataSectionId) {
      case 'basic':
        await this.patchBasic(profile, body);
        break;
      case 'location':
        await this.patchLocation(profile, body);
        break;
      case 'education_career':
        await this.patchEducationCareer(profile, body);
        break;
      case 'faith':
        await this.patchFaith(profile, body);
        break;
      case 'islam_sharia':
        await this.patchIslamSharia(profile, body);
        break;
      case 'privacy':
        await this.patchPrivacy(profile, body);
        break;
      case 'family_heritage':
        await this.patchFamilyHeritage(profile, body);
        break;
      case 'my_attributes':
        await this.patchMyAttributes(profile, body);
        break;
      case 'partner':
        await this.patchPartner(profile, body);
        break;
      case 'partner_location':
        await this.patchPartner(profile, body);
        break;
      case 'guardian_contact':
        await this.patchGuardianContact(profile, body);
        break;
      default:
        throw new BadRequestException(`Unknown biodata section: ${sectionId}`);
    }

    await this.refreshCompleteness(userId);
    return this.getMine(userId);
  }

  private async loadBundle(userId: string) {
    const profile = await this.requireProfile(userId);
    const [myPreference, partnerPreference] = await Promise.all([
      this.prisma.client.myPreference.findUnique({ where: { userId } }),
      this.prisma.client.partnerPreference.findUnique({ where: { userId } }),
    ]);
    return { profile, myPreference, partnerPreference };
  }

  private async requireProfile(userId: string): Promise<Profile> {
    const profile = await this.prisma.client.profile.findUnique({ where: { userId } });
    if (profile) {
      return profile;
    }
    return this.ensureProfileForUser(userId);
  }

  private async ensureProfileForUser(userId: string): Promise<Profile> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      select: {
        tenantId: true,
        username: true,
        firstName: true,
        lastName: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const displayName =
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username || 'Member';

    return this.prisma.client.profile.create({
      data: {
        userId,
        tenantId: user.tenantId,
        displayName,
        gender: Gender.MALE,
        dateOfBirth: PROFILE_STUB_DOB,
        country: 'Unknown',
        city: 'Unknown',
        religion: PrismaReligion.ISLAM,
        isDiscoverable: false,
        completenessScore: 0,
      },
    });
  }

  private async refreshCompleteness(userId: string): Promise<void> {
    const dto = await this.getMine(userId);
    const score = computeBiodataCompleteness(dto);
    await this.prisma.client.profile.update({
      where: { userId },
      data: { completenessScore: score },
    });
  }

  private async patchBasic(profile: Profile, body: Record<string, unknown>): Promise<void> {
    const data: Partial<Profile> = {};
    if (body.displayName !== undefined) {
      data.displayName = readStringField(body.displayName, 'displayName').trim();
    }
    if (body.gender !== undefined) {
      data.gender = body.gender as Gender;
    }
    if (body.dateOfBirth !== undefined) {
      data.dateOfBirth = new Date(readStringField(body.dateOfBirth, 'dateOfBirth'));
    }
    if (body.heightCm !== undefined) {
      data.heightCm = body.heightCm === null ? null : Number(body.heightCm);
    }
    if (body.maritalStatus !== undefined) {
      data.maritalStatus = body.maritalStatus as Profile['maritalStatus'];
    }
    if (body.weightKg !== undefined) {
      data.weightKg = readOptionalBoundedInt(body.weightKg, 'weightKg', 20, 300);
    }
    if (body.bloodGroup !== undefined) {
      if (
        body.bloodGroup !== null &&
        (typeof body.bloodGroup !== 'string' ||
          !(BLOOD_GROUP_VALUES as readonly string[]).includes(body.bloodGroup))
      ) {
        throw new BadRequestException('Invalid bloodGroup');
      }
      data.bloodGroup = body.bloodGroup as Profile['bloodGroup'];
    }
    if (body.hasChronicConditions !== undefined) {
      if (body.hasChronicConditions !== null && typeof body.hasChronicConditions !== 'boolean') {
        throw new BadRequestException('hasChronicConditions must be a boolean or null');
      }
      data.hasChronicConditions = body.hasChronicConditions;
    }
    if (body.chronicConditionsDetail !== undefined) {
      data.chronicConditionsDetail = readOptionalStringField(body.chronicConditionsDetail);
    }
    if (data.hasChronicConditions === false) {
      data.chronicConditionsDetail = null;
    }

    const hasProfileFields = Object.keys(data).length > 0;
    if (hasProfileFields) {
      await this.prisma.client.profile.update({
        where: { id: profile.id },
        data: encryptProfileForStorage(this.crypto, data),
      });
    }

    if (body.complexion !== undefined) {
      if (
        body.complexion !== null &&
        (typeof body.complexion !== 'string' ||
          !(COMPLEXION_SELF_VALUES as readonly string[]).includes(body.complexion))
      ) {
        throw new BadRequestException('Invalid complexion for personal details');
      }
      await this.patchMyAttributes(profile, { complexion: body.complexion });
    }
  }

  private async patchGuardianContact(
    profile: Profile,
    body: Record<string, unknown>,
  ): Promise<void> {
    const guardianName = readStringField(body.guardianName, 'guardianName').trim();
    const guardianRelationship = readStringField(
      body.guardianRelationship,
      'guardianRelationship',
    ).trim();
    const guardianMobile = readStringField(body.guardianMobile, 'guardianMobile').trim();
    const candidateMobile = readStringField(body.candidateMobile, 'candidateMobile').trim();
    const guardianTelegram = readOptionalStringField(body.guardianTelegram);
    const guardianWhatsApp = readOptionalStringField(body.guardianWhatsApp);
    const candidateTelegram = readOptionalStringField(body.candidateTelegram);
    const candidateWhatsApp = readOptionalStringField(body.candidateWhatsApp);

    const pledges: MarriagePledgeState = {
      marriagePledgeInformationTrue: Boolean(body.marriagePledgeInformationTrue),
      marriagePledgeGuardianConsent: Boolean(body.marriagePledgeGuardianConsent),
      marriagePledgeFalseInfoAccountability: Boolean(body.marriagePledgeFalseInfoAccountability),
      marriagePledgeMarkAfterMarriage: Boolean(body.marriagePledgeMarkAfterMarriage),
    };

    const contactFields = {
      guardianName,
      guardianRelationship,
      guardianMobile,
      candidateMobile,
      guardianTelegram: guardianTelegram ?? undefined,
      guardianWhatsApp: guardianWhatsApp ?? undefined,
      candidateTelegram: candidateTelegram ?? undefined,
      candidateWhatsApp: candidateWhatsApp ?? undefined,
    };

    const validationError = validateGuardianContactSection(
      profile.religion,
      contactFields,
      pledges,
    );
    if (validationError) {
      throw new BadRequestException(validationError);
    }

    const phones = normalizeGuardianContactPhonesForSave(contactFields);
    const messaging = normalizeGuardianContactMessagingForSave(contactFields);

    const isIslam = profile.religion === 'ISLAM';
    const data: Partial<Profile> = {
      guardianName,
      guardianRelationship,
      guardianMobile: phones.guardianMobile,
      candidateMobile: phones.candidateMobile,
      guardianTelegram: messaging.guardianTelegram,
      guardianWhatsApp: messaging.guardianWhatsApp,
      candidateTelegram: messaging.candidateTelegram,
      candidateWhatsApp: messaging.candidateWhatsApp,
      marriagePledgeInformationTrue: isIslam ? pledges.marriagePledgeInformationTrue : false,
      marriagePledgeGuardianConsent: isIslam ? pledges.marriagePledgeGuardianConsent : false,
      marriagePledgeFalseInfoAccountability: isIslam
        ? pledges.marriagePledgeFalseInfoAccountability
        : false,
      marriagePledgeMarkAfterMarriage: pledges.marriagePledgeMarkAfterMarriage,
      marriagePledgesAcceptedAt: areRequiredMarriagePledgesComplete(profile.religion, pledges)
        ? new Date()
        : null,
    };

    await this.prisma.client.profile.update({
      where: { id: profile.id },
      data: encryptProfileForStorage(this.crypto, data),
    });
  }

  private async patchLocation(profile: Profile, body: Record<string, unknown>): Promise<void> {
    const data: Partial<Profile> = {};
    if (body.country !== undefined) {
      data.country = readStringField(body.country, 'country').trim();
    }
    if (body.stateRegion !== undefined) {
      data.stateRegion = readOptionalStringField(body.stateRegion);
    }
    if (body.city !== undefined) {
      data.city = readStringField(body.city, 'city').trim();
    }
    if (body.postalCode !== undefined) {
      data.postalCode = readOptionalStringField(body.postalCode);
    }
    const nextLocationDetails =
      body.locationDetails !== undefined
        ? readOptionalStringFieldMaxWords(
            body.locationDetails,
            'locationDetails',
            LOCATION_DETAILS_MAX_WORDS,
          )
        : this.crypto.decryptString(profile.locationDetails);
    const locationDetailsError = validateProfileLocationDetails(nextLocationDetails);
    if (locationDetailsError) {
      throw new BadRequestException(locationDetailsError);
    }
    if (body.locationDetails !== undefined) {
      data.locationDetails = nextLocationDetails;
    }
    if (body.motherTongue !== undefined) {
      data.motherTongue = readOptionalStringField(body.motherTongue);
    }
    await this.prisma.client.profile.update({
      where: { id: profile.id },
      data: encryptProfileForStorage(this.crypto, data),
    });
  }

  private async patchEducationCareer(
    profile: Profile,
    body: Record<string, unknown>,
  ): Promise<void> {
    const data: Partial<Profile> = {};
    const currentYear = new Date().getFullYear();

    if (body.degreeName !== undefined) {
      data.degreeName = readOptionalStringField(body.degreeName);
    }
    if (body.degreeMajor !== undefined) {
      data.degreeMajor = readOptionalStringField(body.degreeMajor);
    }
    if (body.institution !== undefined) {
      data.institution = readOptionalStringField(body.institution);
    }
    if (body.graduationYear !== undefined) {
      data.graduationYear = readOptionalBoundedInt(
        body.graduationYear,
        'graduationYear',
        1950,
        currentYear + 1,
      );
    }
    if (body.occupation !== undefined) {
      data.occupation = readOptionalStringField(body.occupation);
    }
    if (body.employer !== undefined) {
      data.employer = readOptionalStringField(body.employer);
    }
    if (body.yearsExperience !== undefined) {
      data.yearsExperience = readOptionalBoundedInt(body.yearsExperience, 'yearsExperience', 0, 60);
    }
    if (body.workLocation !== undefined) {
      data.workLocation = readOptionalStringField(body.workLocation);
    }
    if (body.bio !== undefined) {
      data.bio = readOptionalStringField(body.bio);
    }
    if (body.education !== undefined) {
      data.education = readOptionalStringField(body.education);
    }

    const degreeFieldsTouched =
      body.degreeName !== undefined ||
      body.degreeMajor !== undefined ||
      body.institution !== undefined;

    if (body.education === undefined && degreeFieldsTouched) {
      const summary = buildLegacyEducationSummary({
        degreeName:
          data.degreeName !== undefined
            ? data.degreeName
            : this.crypto.decryptString(profile.degreeName),
        degreeMajor:
          data.degreeMajor !== undefined
            ? data.degreeMajor
            : this.crypto.decryptString(profile.degreeMajor),
        institution:
          data.institution !== undefined
            ? data.institution
            : this.crypto.decryptString(profile.institution),
      });
      data.education = summary;
    }

    await this.prisma.client.profile.update({
      where: { id: profile.id },
      data: encryptProfileForStorage(this.crypto, data),
    });

    if (body.monthlyIncome !== undefined || body.incomeCurrency !== undefined) {
      if (body.monthlyIncome !== undefined && body.monthlyIncome !== null) {
        const income = Number(body.monthlyIncome);
        if (!Number.isFinite(income) || income < 0) {
          throw new BadRequestException('monthlyIncome must be a non-negative number');
        }
      }
      await this.patchMyAttributes(profile, {
        monthlyIncome: body.monthlyIncome,
        ...(body.incomeCurrency !== undefined ? { incomeCurrency: body.incomeCurrency } : {}),
      });
    }
  }

  private async patchFaith(profile: Profile, body: Record<string, unknown>): Promise<void> {
    const data: Partial<Profile> = {};
    const religionChanged = body.religion !== undefined && body.religion !== profile.religion;

    if (body.religion !== undefined) {
      data.religion = body.religion as Profile['religion'];
    }

    const nextReligion: Religion = data.religion ?? profile.religion;

    if (religionChanged && body.denomination === undefined) {
      data.denomination = null;
    }
    if (religionChanged && body.religiousPractice === undefined) {
      data.religiousPractice = null;
    }
    if (religionChanged && body.islamMaslak === undefined) {
      data.islamMaslak = null;
    }

    if (body.denomination !== undefined) {
      const denomination = readOptionalStringField(body.denomination);
      const branchOptions = getReligionBranchOptions(nextReligion);
      if (denomination != null && branchOptions.length > 0) {
        if (!allowedBranchCodes(nextReligion).includes(denomination)) {
          throw new BadRequestException('Invalid denomination for selected religion');
        }
      }
      data.denomination = denomination;
    }

    const resolvedDenomination =
      data.denomination !== undefined
        ? data.denomination
        : religionChanged
          ? null
          : this.crypto.decryptString(profile.denomination);

    if (body.religiousPractice !== undefined) {
      const practiceRaw = readOptionalStringField(body.religiousPractice);
      if (
        usesIslamMadhabField(nextReligion, resolvedDenomination) &&
        practiceRaw != null &&
        !isIslamMadhabCode(practiceRaw)
      ) {
        throw new BadRequestException('Invalid madhab for Sunni Islam');
      }
      data.religiousPractice = practiceRaw;
    }

    if (
      body.denomination !== undefined &&
      body.religiousPractice === undefined &&
      !usesIslamMadhabField(nextReligion, data.denomination ?? resolvedDenomination)
    ) {
      data.religiousPractice = null;
    }

    if (body.community !== undefined) {
      data.community = readOptionalStringFieldMaxWords(body.community, 'community');
    }

    if (body.islamMaslak !== undefined) {
      if (nextReligion !== 'ISLAM') {
        data.islamMaslak = null;
      } else {
        data.islamMaslak = this.readOptionalEnumValue(
          body.islamMaslak,
          'islamMaslak',
          ISLAM_MASLAK_VALUES,
        );
      }
    }

    const touchesStructuredFaith =
      body.religion !== undefined ||
      body.denomination !== undefined ||
      body.religiousPractice !== undefined;

    if (touchesStructuredFaith) {
      const finalDenomination =
        data.denomination !== undefined
          ? data.denomination
          : religionChanged
            ? null
            : this.crypto.decryptString(profile.denomination);
      const finalReligiousPractice =
        data.religiousPractice !== undefined
          ? data.religiousPractice
          : religionChanged
            ? null
            : this.crypto.decryptString(profile.religiousPractice);

      const faithError = validateFaithSectionRequired({
        religion: nextReligion,
        denomination: finalDenomination,
        religiousPractice: finalReligiousPractice,
      });
      if (faithError) {
        throw new BadRequestException(faithError);
      }
    }

    if (Object.keys(data).length === 0) {
      return;
    }

    await this.prisma.client.profile.update({
      where: { id: profile.id },
      data: encryptProfileForStorage(this.crypto, data),
    });
  }

  private async patchPrivacy(profile: Profile, body: Record<string, unknown>): Promise<void> {
    const data: Prisma.ProfileUpdateInput = {};
    if (body.photoVisibility !== undefined) {
      data.photoVisibility = body.photoVisibility as Profile['photoVisibility'];
    }
    if (body.isDiscoverable !== undefined) {
      data.isDiscoverable = Boolean(body.isDiscoverable);
    }
    if (body.showContactOnlyToAccepted !== undefined) {
      data.showContactOnlyToAccepted = Boolean(body.showContactOnlyToAccepted);
    }
    if (body.hideFromContacts !== undefined) {
      data.hideFromContacts = Boolean(body.hideFromContacts);
    }
    if (body.guardianManaged !== undefined) {
      data.guardianManaged = Boolean(body.guardianManaged);
    }
    await this.prisma.client.profile.update({
      where: { id: profile.id },
      data,
    });
  }

  private readOptionalEnumValue<T extends string>(
    value: unknown,
    field: string,
    allowed: readonly T[],
  ): T | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
      throw new BadRequestException(`Invalid ${field}`);
    }
    return value as T;
  }

  private async patchIslamSharia(profile: Profile, body: Record<string, unknown>): Promise<void> {
    if (profile.religion !== 'ISLAM') {
      throw new BadRequestException(
        'Islam sharia section is only available when religion is Islam',
      );
    }

    const data: Partial<Profile> = {};
    const isMale = profile.gender === 'MALE';
    const isFemale = profile.gender === 'FEMALE';

    if (body.prayerRegularity !== undefined) {
      data.prayerRegularity = this.readOptionalEnumValue(
        body.prayerRegularity,
        'prayerRegularity',
        PRAYER_REGULARITY_VALUES,
      );
    }
    if (body.missedFardPrayersNotes !== undefined) {
      data.missedFardPrayersNotes = readOptionalStringFieldMaxWords(
        body.missedFardPrayersNotes,
        'missedFardPrayersNotes',
        ISLAM_SHARIA_TEXT_MAX_WORDS,
      );
    }
    if (body.aqeedahNotes !== undefined) {
      data.aqeedahNotes = readOptionalStringFieldMaxWords(
        body.aqeedahNotes,
        'aqeedahNotes',
        ISLAM_SHARIA_TEXT_MAX_WORDS,
      );
    }
    if (isMale && body.sunnahBeardStatus !== undefined) {
      data.sunnahBeardStatus = this.readOptionalEnumValue(
        body.sunnahBeardStatus,
        'sunnahBeardStatus',
        SUNNAH_BEARD_STATUS_VALUES,
      );
    }
    if (isMale && body.beardDetails !== undefined) {
      data.beardDetails = readOptionalStringFieldMaxWords(
        body.beardDetails,
        'beardDetails',
        ISLAM_SHARIA_TEXT_MAX_WORDS,
      );
    }
    if (body.usualOutdoorClothing !== undefined) {
      data.usualOutdoorClothing = readOptionalStringFieldMaxWords(
        body.usualOutdoorClothing,
        'usualOutdoorClothing',
        ISLAM_SHARIA_TEXT_MAX_WORDS,
      );
    }
    if (body.quranRecitationLevel !== undefined) {
      data.quranRecitationLevel = this.readOptionalEnumValue(
        body.quranRecitationLevel,
        'quranRecitationLevel',
        QURAN_RECITATION_LEVEL_VALUES,
      );
    }
    if (body.favoriteIslamicBooks !== undefined) {
      data.favoriteIslamicBooks = readOptionalStringFieldMaxWords(
        body.favoriteIslamicBooks,
        'favoriteIslamicBooks',
        ISLAM_SHARIA_TEXT_MAX_WORDS,
      );
    }
    if (body.favoriteScholars !== undefined) {
      data.favoriteScholars = readOptionalStringFieldMaxWords(
        body.favoriteScholars,
        'favoriteScholars',
        ISLAM_SHARIA_TEXT_MAX_WORDS,
      );
    }
    if (body.clothingAboveAnkles !== undefined) {
      data.clothingAboveAnkles = this.readOptionalEnumValue(
        body.clothingAboveAnkles,
        'clothingAboveAnkles',
        CLOTHING_ABOVE_ANKLES_VALUES,
      );
    }
    if (body.mahramCompliance !== undefined) {
      data.mahramCompliance = this.readOptionalEnumValue(
        body.mahramCompliance,
        'mahramCompliance',
        MAHRAM_COMPLIANCE_VALUES,
      );
    }
    if (body.entertainmentHabits !== undefined) {
      data.entertainmentHabits = readOptionalStringFieldMaxWords(
        body.entertainmentHabits,
        'entertainmentHabits',
        ISLAM_SHARIA_TEXT_MAX_WORDS,
      );
    }
    if (body.dawahInvolvement !== undefined) {
      data.dawahInvolvement = readOptionalStringFieldMaxWords(
        body.dawahInvolvement,
        'dawahInvolvement',
        ISLAM_SHARIA_TEXT_MAX_WORDS,
      );
    }
    if (body.quranHifzNotes !== undefined) {
      data.quranHifzNotes = readOptionalStringFieldMaxWords(
        body.quranHifzNotes,
        'quranHifzNotes',
        ISLAM_SHARIA_TEXT_MAX_WORDS,
      );
    }
    if (body.incomeFullyHalal !== undefined) {
      if (body.incomeFullyHalal !== null && typeof body.incomeFullyHalal !== 'boolean') {
        throw new BadRequestException('incomeFullyHalal must be a boolean or null');
      }
      data.incomeFullyHalal = body.incomeFullyHalal;
    }
    if (isFemale && body.hijabPurdah !== undefined) {
      data.hijabPurdah = this.readOptionalEnumValue(
        body.hijabPurdah,
        'hijabPurdah',
        HIJAB_PURDAH_VALUES,
      );
    }
    if (isMale && body.hijabPurdah !== undefined) {
      data.hijabPurdah = null;
    }

    try {
      validateIslamShariaTextFields({
        missedFardPrayersNotes: data.missedFardPrayersNotes,
        aqeedahNotes: data.aqeedahNotes,
        beardDetails: data.beardDetails,
        usualOutdoorClothing: data.usualOutdoorClothing,
        favoriteIslamicBooks: data.favoriteIslamicBooks,
        favoriteScholars: data.favoriteScholars,
        entertainmentHabits: data.entertainmentHabits,
        dawahInvolvement: data.dawahInvolvement,
        quranHifzNotes: data.quranHifzNotes,
      });
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid text field');
    }

    if (Object.keys(data).length === 0) {
      return;
    }

    await this.prisma.client.profile.update({
      where: { id: profile.id },
      data: encryptProfileForStorage(this.crypto, data),
    });
  }

  private async patchFamilyHeritage(
    profile: Profile,
    body: Record<string, unknown>,
  ): Promise<void> {
    const data: Partial<Profile> = {};

    if (body.fatherIsAlive !== undefined) {
      data.fatherIsAlive = readOptionalBooleanNull(body.fatherIsAlive, 'fatherIsAlive');
    }
    if (body.motherIsAlive !== undefined) {
      data.motherIsAlive = readOptionalBooleanNull(body.motherIsAlive, 'motherIsAlive');
    }
    if (body.fatherProfession !== undefined) {
      data.fatherProfession = readOptionalStringField(body.fatherProfession);
    }
    if (body.motherProfession !== undefined) {
      data.motherProfession = readOptionalStringField(body.motherProfession);
    }
    if (body.brotherCount !== undefined) {
      data.brotherCount = readOptionalBoundedInt(body.brotherCount, 'brotherCount', 0, 50);
    }
    if (body.sisterCount !== undefined) {
      data.sisterCount = readOptionalBoundedInt(body.sisterCount, 'sisterCount', 0, 50);
    }
    if (body.unclesOccupations !== undefined) {
      data.unclesOccupations = readOptionalStringField(body.unclesOccupations);
    }
    if (body.residenceDescription !== undefined) {
      data.residenceDescription = readOptionalStringField(body.residenceDescription);
    }
    if (body.familyEconomicClass !== undefined) {
      if (
        body.familyEconomicClass !== null &&
        (typeof body.familyEconomicClass !== 'string' ||
          !FAMILY_ECONOMIC_CLASS_VALUES.includes(body.familyEconomicClass as never))
      ) {
        throw new BadRequestException('Invalid familyEconomicClass');
      }
      data.familyEconomicClass = body.familyEconomicClass as Profile['familyEconomicClass'];
    }
    if (body.familyRelatives !== undefined) {
      const relatives = parseFamilyRelatives(body.familyRelatives);
      if (relatives.length > FAMILY_HERITAGE_MAX_RELATIVES) {
        throw new BadRequestException(
          `familyRelatives must have at most ${FAMILY_HERITAGE_MAX_RELATIVES} entries`,
        );
      }
      data.familyRelatives = relatives as unknown as Profile['familyRelatives'];
    }

    try {
      validateFamilyHeritageTextFields({
        fatherProfession: data.fatherProfession,
        motherProfession: data.motherProfession,
        unclesOccupations: data.unclesOccupations,
        residenceDescription: data.residenceDescription,
      });
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid text field');
    }

    if (Object.keys(data).length === 0) {
      return;
    }

    await this.prisma.client.profile.update({
      where: { id: profile.id },
      data: encryptProfileForStorage(this.crypto, data),
    });
  }

  private async patchMyAttributes(profile: Profile, body: Record<string, unknown>): Promise<void> {
    const existing = await this.prisma.client.myPreference.findUnique({
      where: { userId: profile.userId },
    });

    const writable = this.buildMyPreferenceWritable(body, existing);
    const encrypted = encryptMyPreferenceForStorage(this.crypto, {
      district: writable.district,
      country: writable.country,
      denomination: writable.denomination,
      community: writable.community,
      motherTongue: writable.motherTongue,
      customExpectations: writable.customExpectations,
    });
    const data = this.toMyPreferenceDbRow(writable, encrypted);

    if (existing) {
      await this.prisma.client.myPreference.update({
        where: { userId: profile.userId },
        data,
      });
      return;
    }

    await this.prisma.client.myPreference.create({
      data: {
        ...(data as Prisma.MyPreferenceUncheckedCreateInput),
        profileId: profile.id,
        userId: profile.userId,
        tenantId: profile.tenantId,
      },
    });
  }

  private toMyPreferenceDbRow(
    writable: MyPreferenceWritePayload,
    encrypted: ReturnType<typeof encryptMyPreferenceForStorage>,
  ): Prisma.MyPreferenceUncheckedUpdateInput {
    return {
      gender: writable.gender,
      complexion: writable.complexion ?? null,
      heightCm: writable.heightCm ?? null,
      educationLevel: writable.educationLevel ?? null,
      occupation: writable.occupation ?? null,
      maritalStatus: writable.maritalStatus ?? null,
      monthlyIncome:
        writable.monthlyIncome == null ? null : new Prisma.Decimal(writable.monthlyIncome),
      incomeCurrency: writable.incomeCurrency ?? 'USD',
      residenceType: writable.residenceType ?? null,
      familyStatus: writable.familyStatus ?? null,
      siblingCount: writable.siblingCount ?? null,
      siblingPosition: writable.siblingPosition ?? null,
      district: encrypted.district !== undefined ? encrypted.district : (writable.district ?? null),
      country: encrypted.country !== undefined ? encrypted.country : (writable.country ?? null),
      religion: writable.religion ?? null,
      denomination:
        encrypted.denomination !== undefined
          ? encrypted.denomination
          : (writable.denomination ?? null),
      community:
        encrypted.community !== undefined ? encrypted.community : (writable.community ?? null),
      motherTongue:
        encrypted.motherTongue !== undefined
          ? encrypted.motherTongue
          : (writable.motherTongue ?? null),
      employmentTypes: writable.employmentTypes ?? [],
      willingToRelocate: writable.willingToRelocate ?? false,
      openToAbroad: writable.openToAbroad ?? false,
      customExpectations: (encrypted.customExpectations ??
        writable.customExpectations ??
        {}) as Prisma.InputJsonValue,
      isActive: writable.isActive ?? true,
    };
  }

  private buildMyPreferenceWritable(
    body: Record<string, unknown>,
    existing: MyPreference | null,
  ): MyPreferenceWritePayload {
    if (body.customExpectations !== undefined) {
      const size = Buffer.byteLength(JSON.stringify(body.customExpectations), 'utf8');
      if (size > CUSTOM_EXPECTATIONS_MAX_BYTES) {
        throw new BadRequestException('customExpectations payload is too large');
      }
    }

    return {
      gender: (body.gender ?? existing?.gender ?? Gender.MALE) as Gender,
      complexion:
        body.complexion !== undefined
          ? (body.complexion as MyPreference['complexion'])
          : existing?.complexion,
      heightCm:
        body.heightCm !== undefined
          ? body.heightCm === null
            ? null
            : Number(body.heightCm)
          : existing?.heightCm,
      educationLevel:
        body.educationLevel !== undefined
          ? (body.educationLevel as MyPreference['educationLevel'])
          : existing?.educationLevel,
      occupation:
        body.occupation !== undefined
          ? (body.occupation as MyPreference['occupation'])
          : existing?.occupation,
      maritalStatus:
        body.maritalStatus !== undefined
          ? (body.maritalStatus as MyPreference['maritalStatus'])
          : existing?.maritalStatus,
      monthlyIncome:
        body.monthlyIncome !== undefined
          ? body.monthlyIncome === null
            ? null
            : Number(body.monthlyIncome)
          : (existing?.monthlyIncome?.toNumber() ?? null),
      incomeCurrency:
        body.incomeCurrency !== undefined
          ? readStringField(body.incomeCurrency, 'incomeCurrency')
          : (existing?.incomeCurrency ?? 'USD'),
      residenceType:
        body.residenceType !== undefined
          ? (body.residenceType as MyPreference['residenceType'])
          : existing?.residenceType,
      familyStatus:
        body.familyStatus !== undefined
          ? (body.familyStatus as MyPreference['familyStatus'])
          : existing?.familyStatus,
      siblingCount:
        body.siblingCount !== undefined
          ? body.siblingCount === null
            ? null
            : Number(body.siblingCount)
          : existing?.siblingCount,
      siblingPosition:
        body.siblingPosition !== undefined
          ? (body.siblingPosition as MyPreference['siblingPosition'])
          : existing?.siblingPosition,
      district:
        body.district !== undefined
          ? readOptionalStringField(body.district)
          : this.crypto.decryptString(existing?.district ?? null),
      country:
        body.country !== undefined
          ? readOptionalStringField(body.country)
          : this.crypto.decryptString(existing?.country ?? null),
      religion:
        body.religion !== undefined
          ? (body.religion as MyPreference['religion'])
          : existing?.religion,
      denomination:
        body.denomination !== undefined
          ? readOptionalStringField(body.denomination)
          : this.crypto.decryptString(existing?.denomination ?? null),
      community:
        body.community !== undefined
          ? readOptionalStringField(body.community)
          : this.crypto.decryptString(existing?.community ?? null),
      motherTongue:
        body.motherTongue !== undefined
          ? readOptionalStringField(body.motherTongue)
          : this.crypto.decryptString(existing?.motherTongue ?? null),
      employmentTypes:
        body.employmentTypes !== undefined
          ? (body.employmentTypes as MyPreference['employmentTypes'])
          : (existing?.employmentTypes ?? []),
      willingToRelocate:
        body.willingToRelocate !== undefined
          ? Boolean(body.willingToRelocate)
          : (existing?.willingToRelocate ?? false),
      openToAbroad:
        body.openToAbroad !== undefined
          ? Boolean(body.openToAbroad)
          : (existing?.openToAbroad ?? false),
      customExpectations:
        body.customExpectations !== undefined
          ? (body.customExpectations as Record<string, unknown>)
          : this.crypto.decryptJson(existing?.customExpectations),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : (existing?.isActive ?? true),
    };
  }

  private async patchPartner(profile: Profile, body: Record<string, unknown>): Promise<void> {
    const existing = await this.prisma.client.partnerPreference.findUnique({
      where: { userId: profile.userId },
    });

    const minAge = body.minAge !== undefined ? Number(body.minAge) : (existing?.minAge ?? 21);
    const maxAge = body.maxAge !== undefined ? Number(body.maxAge) : (existing?.maxAge ?? 35);
    const minHeightCm =
      body.minHeightCm !== undefined
        ? body.minHeightCm === null
          ? null
          : Number(body.minHeightCm)
        : (existing?.minHeightCm ?? null);
    const maxHeightCm =
      body.maxHeightCm !== undefined
        ? body.maxHeightCm === null
          ? null
          : Number(body.maxHeightCm)
        : (existing?.maxHeightCm ?? null);
    const minMonthlyIncome =
      body.minMonthlyIncome !== undefined
        ? body.minMonthlyIncome === null
          ? null
          : Number(body.minMonthlyIncome)
        : (existing?.minMonthlyIncome?.toNumber() ?? null);
    const maxMonthlyIncome =
      body.maxMonthlyIncome !== undefined
        ? body.maxMonthlyIncome === null
          ? null
          : Number(body.maxMonthlyIncome)
        : (existing?.maxMonthlyIncome?.toNumber() ?? null);

    const ageError = getAgeRangeError(minAge, maxAge);
    if (ageError) {
      throw new BadRequestException(ageError);
    }
    const heightError = getHeightRangeError(minHeightCm, maxHeightCm);
    if (heightError) {
      throw new BadRequestException(heightError);
    }
    const incomeError = getIncomeRangeError(minMonthlyIncome, maxMonthlyIncome);
    if (incomeError) {
      throw new BadRequestException(incomeError);
    }
    const existingCustom = existing
      ? (this.crypto.decryptJson(existing.customExpectations) as CustomExpectations)
      : ({} as CustomExpectations);

    let mergedCustomExpectations: CustomExpectations = existingCustom;
    if (body.customExpectations !== undefined) {
      const patch = body.customExpectations as Partial<CustomExpectations>;
      const notesError = validatePartnerCustomExpectationsNotes(patch);
      if (notesError) {
        throw new BadRequestException(notesError);
      }
      mergedCustomExpectations = mergePartnerCustomExpectations(existingCustom, patch);
      const size = Buffer.byteLength(JSON.stringify(mergedCustomExpectations), 'utf8');
      if (size > CUSTOM_EXPECTATIONS_MAX_BYTES) {
        throw new BadRequestException('customExpectations payload is too large');
      }
    }

    const preferredGender = resolvePreferredGender(profile.gender);
    const writable: PartnerPreferenceWritePayload = {
      preferredGender,
      minAge,
      maxAge,
      complexions:
        body.complexions !== undefined
          ? (body.complexions as PartnerPreference['complexions'])
          : (existing?.complexions ?? []),
      minHeightCm,
      maxHeightCm,
      educationLevels:
        body.educationLevels !== undefined
          ? (body.educationLevels as PartnerPreference['educationLevels'])
          : (existing?.educationLevels ?? []),
      occupations:
        body.occupations !== undefined
          ? (body.occupations as PartnerPreference['occupations'])
          : (existing?.occupations ?? []),
      maritalStatuses:
        body.maritalStatuses !== undefined
          ? (body.maritalStatuses as PartnerPreference['maritalStatuses'])
          : (existing?.maritalStatuses ?? []),
      minMonthlyIncome,
      maxMonthlyIncome,
      incomeCurrency:
        body.incomeCurrency !== undefined
          ? readStringField(body.incomeCurrency, 'incomeCurrency')
          : (existing?.incomeCurrency ?? 'USD'),
      residenceType:
        body.residenceType !== undefined
          ? (body.residenceType as PartnerPreference['residenceType'])
          : (existing?.residenceType ?? null),
      familyStatus:
        body.familyStatus !== undefined
          ? (body.familyStatus as PartnerPreference['familyStatus'])
          : (existing?.familyStatus ?? null),
      siblingCountPreference:
        body.siblingCountPreference !== undefined
          ? body.siblingCountPreference === null
            ? null
            : Number(body.siblingCountPreference)
          : (existing?.siblingCountPreference ?? null),
      siblingPositionPreference:
        body.siblingPositionPreference !== undefined
          ? (body.siblingPositionPreference as PartnerPreference['siblingPositionPreference'])
          : (existing?.siblingPositionPreference ?? null),
      preferredDistricts:
        body.preferredDistricts !== undefined
          ? (body.preferredDistricts as string[])
          : this.crypto.decryptStringArray(existing?.preferredDistricts ?? []),
      preferredCountries:
        body.preferredCountries !== undefined
          ? (body.preferredCountries as string[])
          : this.crypto.decryptStringArray(existing?.preferredCountries ?? []),
      preferredReligions:
        body.preferredReligions !== undefined
          ? (body.preferredReligions as PartnerPreference['preferredReligions'])
          : (existing?.preferredReligions ?? []),
      preferredDenominations:
        body.preferredDenominations !== undefined
          ? (body.preferredDenominations as string[])
          : this.crypto.decryptStringArray(existing?.preferredDenominations ?? []),
      preferredCommunities:
        body.preferredCommunities !== undefined
          ? (body.preferredCommunities as string[])
          : this.crypto.decryptStringArray(existing?.preferredCommunities ?? []),
      preferredMotherTongues:
        body.preferredMotherTongues !== undefined
          ? (body.preferredMotherTongues as string[])
          : this.crypto.decryptStringArray(existing?.preferredMotherTongues ?? []),
      employmentTypes:
        body.employmentTypes !== undefined
          ? (body.employmentTypes as PartnerPreference['employmentTypes'])
          : (existing?.employmentTypes ?? []),
      willingToRelocate:
        body.willingToRelocate !== undefined
          ? Boolean(body.willingToRelocate)
          : (existing?.willingToRelocate ?? false),
      openToAbroad:
        body.openToAbroad !== undefined
          ? Boolean(body.openToAbroad)
          : (existing?.openToAbroad ?? false),
      requiresVerifiedProfile:
        body.requiresVerifiedProfile !== undefined
          ? Boolean(body.requiresVerifiedProfile)
          : (existing?.requiresVerifiedProfile ?? false),
      minProfileCompleteness:
        body.minProfileCompleteness !== undefined
          ? Number(body.minProfileCompleteness)
          : (existing?.minProfileCompleteness ?? 0),
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : (existing?.isActive ?? true),
      customExpectations:
        body.customExpectations !== undefined ? mergedCustomExpectations : existingCustom,
    };

    const encrypted = encryptPartnerPreferenceForStorage(this.crypto, {
      preferredDistricts: writable.preferredDistricts,
      preferredCountries: writable.preferredCountries,
      preferredDenominations: writable.preferredDenominations,
      preferredCommunities: writable.preferredCommunities,
      preferredMotherTongues: writable.preferredMotherTongues,
      customExpectations: writable.customExpectations,
    });
    const data = this.toPartnerPreferenceDbRow(writable, encrypted);

    if (existing) {
      await this.prisma.client.partnerPreference.update({
        where: { userId: profile.userId },
        data,
      });
      return;
    }

    await this.prisma.client.partnerPreference.create({
      data: {
        ...(data as Prisma.PartnerPreferenceUncheckedCreateInput),
        profileId: profile.id,
        userId: profile.userId,
        tenantId: profile.tenantId,
      },
    });
  }

  private toPartnerPreferenceDbRow(
    writable: PartnerPreferenceWritePayload,
    encrypted: ReturnType<typeof encryptPartnerPreferenceForStorage>,
  ): Prisma.PartnerPreferenceUncheckedUpdateInput {
    return {
      preferredGender: writable.preferredGender,
      minAge: writable.minAge,
      maxAge: writable.maxAge,
      complexions: writable.complexions,
      minHeightCm: writable.minHeightCm,
      maxHeightCm: writable.maxHeightCm,
      educationLevels: writable.educationLevels,
      occupations: writable.occupations,
      maritalStatuses: writable.maritalStatuses,
      minMonthlyIncome:
        writable.minMonthlyIncome == null ? null : new Prisma.Decimal(writable.minMonthlyIncome),
      maxMonthlyIncome:
        writable.maxMonthlyIncome == null ? null : new Prisma.Decimal(writable.maxMonthlyIncome),
      incomeCurrency: writable.incomeCurrency,
      residenceType: writable.residenceType,
      familyStatus: writable.familyStatus,
      siblingCountPreference: writable.siblingCountPreference,
      siblingPositionPreference: writable.siblingPositionPreference,
      preferredDistricts:
        encrypted.preferredDistricts !== undefined
          ? encrypted.preferredDistricts
          : writable.preferredDistricts,
      preferredCountries:
        encrypted.preferredCountries !== undefined
          ? encrypted.preferredCountries
          : writable.preferredCountries,
      preferredReligions: writable.preferredReligions,
      preferredDenominations:
        encrypted.preferredDenominations !== undefined
          ? encrypted.preferredDenominations
          : writable.preferredDenominations,
      preferredCommunities:
        encrypted.preferredCommunities !== undefined
          ? encrypted.preferredCommunities
          : writable.preferredCommunities,
      preferredMotherTongues:
        encrypted.preferredMotherTongues !== undefined
          ? encrypted.preferredMotherTongues
          : writable.preferredMotherTongues,
      employmentTypes: writable.employmentTypes,
      willingToRelocate: writable.willingToRelocate,
      openToAbroad: writable.openToAbroad,
      requiresVerifiedProfile: writable.requiresVerifiedProfile,
      minProfileCompleteness: writable.minProfileCompleteness,
      isActive: writable.isActive,
      customExpectations: (encrypted.customExpectations ??
        writable.customExpectations ??
        {}) as Prisma.InputJsonValue,
    };
  }
}
