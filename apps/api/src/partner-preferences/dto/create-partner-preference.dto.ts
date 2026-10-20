import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ComplexionPreference,
  EducationPreference,
  EmploymentTypePreference,
  FamilyStatusPreference,
  MaritalStatus,
  OccupationPreference,
  PARTNER_PREFERENCE_MAX_AGE,
  PARTNER_PREFERENCE_MIN_AGE,
  Religion,
  ResidenceTypePreference,
  SiblingPositionPreference,
} from '@soulsync/db';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePartnerPreferenceDto {
  @ApiPropertyOptional({ minimum: PARTNER_PREFERENCE_MIN_AGE, maximum: PARTNER_PREFERENCE_MAX_AGE })
  @IsOptional()
  @IsInt()
  @Min(PARTNER_PREFERENCE_MIN_AGE)
  @Max(PARTNER_PREFERENCE_MAX_AGE)
  minAge?: number;

  @ApiPropertyOptional({ minimum: PARTNER_PREFERENCE_MIN_AGE, maximum: PARTNER_PREFERENCE_MAX_AGE })
  @IsOptional()
  @IsInt()
  @Min(PARTNER_PREFERENCE_MIN_AGE)
  @Max(PARTNER_PREFERENCE_MAX_AGE)
  maxAge?: number;

  @ApiPropertyOptional({ enum: ComplexionPreference, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ComplexionPreference, { each: true })
  complexions?: ComplexionPreference[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(250)
  minHeightCm?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(250)
  maxHeightCm?: number | null;

  @ApiPropertyOptional({ enum: EducationPreference, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(EducationPreference, { each: true })
  educationLevels?: EducationPreference[];

  @ApiPropertyOptional({ enum: OccupationPreference, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(OccupationPreference, { each: true })
  occupations?: OccupationPreference[];

  @ApiPropertyOptional({ enum: MaritalStatus, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(MaritalStatus, { each: true })
  maritalStatuses?: MaritalStatus[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minMonthlyIncome?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxMonthlyIncome?: number | null;

  @ApiPropertyOptional({ maxLength: 8 })
  @IsOptional()
  @IsString()
  @MaxLength(8)
  incomeCurrency?: string;

  @ApiPropertyOptional({ enum: ResidenceTypePreference })
  @IsOptional()
  @IsEnum(ResidenceTypePreference)
  residenceType?: ResidenceTypePreference | null;

  @ApiPropertyOptional({ enum: FamilyStatusPreference })
  @IsOptional()
  @IsEnum(FamilyStatusPreference)
  familyStatus?: FamilyStatusPreference | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  siblingCountPreference?: number | null;

  @ApiPropertyOptional({ enum: SiblingPositionPreference })
  @IsOptional()
  @IsEnum(SiblingPositionPreference)
  siblingPositionPreference?: SiblingPositionPreference | null;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredDistricts?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredCountries?: string[];

  @ApiPropertyOptional({ enum: Religion, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(Religion, { each: true })
  preferredReligions?: Religion[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredDenominations?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredCommunities?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferredMotherTongues?: string[];

  @ApiPropertyOptional({ enum: EmploymentTypePreference, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(EmploymentTypePreference, { each: true })
  employmentTypes?: EmploymentTypePreference[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  willingToRelocate?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  openToAbroad?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  requiresVerifiedProfile?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  minProfileCompleteness?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  customExpectations?: Record<string, unknown>;
}
