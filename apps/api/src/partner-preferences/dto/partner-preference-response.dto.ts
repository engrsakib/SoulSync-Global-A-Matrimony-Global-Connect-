import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ComplexionPreference,
  EducationPreference,
  EmploymentTypePreference,
  FamilyStatusPreference,
  Gender,
  MaritalStatus,
  OccupationPreference,
  Religion,
  ResidenceTypePreference,
  SiblingPositionPreference,
} from '@soulsync/db';

export class PartnerPreferenceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  profileId!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  tenantId!: string;

  @ApiProperty({ enum: Gender })
  preferredGender!: Gender;

  @ApiProperty()
  minAge!: number;

  @ApiProperty()
  maxAge!: number;

  @ApiProperty({ enum: ComplexionPreference, isArray: true })
  complexions!: ComplexionPreference[];

  @ApiPropertyOptional({ nullable: true })
  minHeightCm!: number | null;

  @ApiPropertyOptional({ nullable: true })
  maxHeightCm!: number | null;

  @ApiProperty({ enum: EducationPreference, isArray: true })
  educationLevels!: EducationPreference[];

  @ApiProperty({ enum: OccupationPreference, isArray: true })
  occupations!: OccupationPreference[];

  @ApiProperty({ enum: MaritalStatus, isArray: true })
  maritalStatuses!: MaritalStatus[];

  @ApiPropertyOptional({ nullable: true })
  minMonthlyIncome!: number | null;

  @ApiPropertyOptional({ nullable: true })
  maxMonthlyIncome!: number | null;

  @ApiProperty()
  incomeCurrency!: string;

  @ApiPropertyOptional({ enum: ResidenceTypePreference, nullable: true })
  residenceType!: ResidenceTypePreference | null;

  @ApiPropertyOptional({ enum: FamilyStatusPreference, nullable: true })
  familyStatus!: FamilyStatusPreference | null;

  @ApiPropertyOptional({ nullable: true })
  siblingCountPreference!: number | null;

  @ApiPropertyOptional({ enum: SiblingPositionPreference, nullable: true })
  siblingPositionPreference!: SiblingPositionPreference | null;

  @ApiProperty({ type: [String] })
  preferredDistricts!: string[];

  @ApiProperty({ type: [String] })
  preferredCountries!: string[];

  @ApiProperty({ enum: Religion, isArray: true })
  preferredReligions!: Religion[];

  @ApiProperty({ type: [String] })
  preferredDenominations!: string[];

  @ApiProperty({ type: [String] })
  preferredCommunities!: string[];

  @ApiProperty({ type: [String] })
  preferredMotherTongues!: string[];

  @ApiProperty({ enum: EmploymentTypePreference, isArray: true })
  employmentTypes!: EmploymentTypePreference[];

  @ApiProperty()
  willingToRelocate!: boolean;

  @ApiProperty()
  openToAbroad!: boolean;

  @ApiProperty()
  requiresVerifiedProfile!: boolean;

  @ApiProperty()
  minProfileCompleteness!: number;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: 'object', additionalProperties: true })
  customExpectations!: Record<string, unknown>;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
