import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateResumeDto } from './create-resume.dto';

// export class UpdateResumeDto extends OmitType(CreateResumeDto, [
//   'email',
//   'userId',
//   'url',
//   'companyId',
//   'jobId',
// ]) {}

export class UpdateResumeDto extends PartialType(CreateResumeDto) {}
