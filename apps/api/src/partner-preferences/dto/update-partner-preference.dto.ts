import { PartialType } from '@nestjs/swagger';
import { CreatePartnerPreferenceDto } from './create-partner-preference.dto';

export class UpdatePartnerPreferenceDto extends PartialType(CreatePartnerPreferenceDto) {}
