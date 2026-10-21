import type { BiodataMeDto } from '@soulsync/shared-types/biodata';
import type { ShareableBiodataSectionId } from '@soulsync/shared-types/biodata-visibility';

/** Build a JSON-safe slice of decrypted biodata for one shareable section. */
export function buildSectionViewContent(
  sectionId: ShareableBiodataSectionId,
  data: BiodataMeDto,
): Record<string, unknown> {
  const p = data.profile;
  const mp = data.myPreference;
  const pp = data.partnerPreference;

  switch (sectionId) {
    case 'basic':
      return {
        displayName: p.displayName,
        gender: p.gender,
        dateOfBirth: p.dateOfBirth,
        heightCm: p.heightCm,
        weightKg: p.weightKg,
        bloodGroup: p.bloodGroup,
        hasChronicConditions: p.hasChronicConditions,
        chronicConditionsDetail: p.chronicConditionsDetail,
        maritalStatus: p.maritalStatus,
        complexion: mp?.complexion ?? null,
      };
    case 'faith':
      return {
        religion: p.religion,
        denomination: p.denomination,
        community: p.community,
        religiousPractice: p.religiousPractice,
        islamMaslak: p.islamMaslak,
      };
    case 'islam_sharia':
      return {
        prayerRegularity: p.prayerRegularity,
        missedFardPrayersNotes: p.missedFardPrayersNotes,
        aqeedahNotes: p.aqeedahNotes,
        sunnahBeardStatus: p.sunnahBeardStatus,
        beardDetails: p.beardDetails,
        usualOutdoorClothing: p.usualOutdoorClothing,
        quranRecitationLevel: p.quranRecitationLevel,
        clothingAboveAnkles: p.clothingAboveAnkles,
        mahramCompliance: p.mahramCompliance,
        quranHifzNotes: p.quranHifzNotes,
        incomeFullyHalal: p.incomeFullyHalal,
        hijabPurdah: p.hijabPurdah,
        gender: p.gender,
      };
    case 'location':
      return {
        country: p.country,
        stateRegion: p.stateRegion,
        city: p.city,
        postalCode: p.postalCode,
        checkInTimeZone: p.checkInTimeZone,
        locationDetails: p.locationDetails,
        motherTongue: p.motherTongue,
      };
    case 'education_career':
      return {
        education: p.education,
        degreeName: p.degreeName,
        degreeMajor: p.degreeMajor,
        institution: p.institution,
        graduationYear: p.graduationYear,
        occupation: p.occupation,
        employer: p.employer,
        yearsExperience: p.yearsExperience,
        workLocation: p.workLocation,
        bio: p.bio,
        monthlyIncome: mp?.monthlyIncome ?? null,
        incomeCurrency: mp?.incomeCurrency ?? null,
      };
    case 'family_heritage':
      return {
        fatherIsAlive: p.fatherIsAlive,
        motherIsAlive: p.motherIsAlive,
        fatherProfession: p.fatherProfession,
        motherProfession: p.motherProfession,
        brotherCount: p.brotherCount,
        sisterCount: p.sisterCount,
        familyRelatives: p.familyRelatives,
        unclesOccupations: p.unclesOccupations,
        residenceDescription: p.residenceDescription,
        familyEconomicClass: p.familyEconomicClass,
      };
    case 'my_attributes':
      return mp ? { ...mp } : {};
    case 'partner':
      return pp ? { partnerPreference: pp } : {};
    case 'partner_location':
      return pp?.customExpectations
        ? { customExpectations: pp.customExpectations }
        : {};
    case 'guardian_contact':
      return {
        guardianRelationship: p.guardianRelationship,
        guardianName: p.guardianName,
        guardianMobile: p.guardianMobile,
        guardianWhatsApp: p.guardianWhatsApp,
        guardianTelegram: p.guardianTelegram,
        candidateMobile: p.candidateMobile,
        candidateWhatsApp: p.candidateWhatsApp,
        candidateTelegram: p.candidateTelegram,
        marriagePledgeInformationTrue: p.marriagePledgeInformationTrue,
        marriagePledgeGuardianConsent: p.marriagePledgeGuardianConsent,
        marriagePledgeFalseInfoAccountability: p.marriagePledgeFalseInfoAccountability,
        marriagePledgeMarkAfterMarriage: p.marriagePledgeMarkAfterMarriage,
        marriagePledgesAcceptedAt: p.marriagePledgesAcceptedAt,
      };
    default:
      return {};
  }
}
