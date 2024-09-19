import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  ValidateNested,
} from 'class-validator';
import mongoose from 'mongoose';

class Company {
  @IsNotEmpty()
  _id: mongoose.Schema.Types.ObjectId;

  @IsNotEmpty()
  name: string;
}

export class CreateJobDto {
  @IsNotEmpty({ message: 'Name không được để trống' })
  name: string;

  @IsArray()
  @IsNotEmpty({ message: 'Skills không được để trống' })
  skills: string[];

  @IsNotEmptyObject()
  @IsObject()
  @ValidateNested()
  @Type(() => Company)
  company: Company;

  // @IsNotEmpty({ message: 'Location không được để trống' })
  location: string;

  @IsNotEmpty({ message: 'Salary không được để trống' })
  salary: number;

  @IsNotEmpty({ message: 'Quantity không được để trống' })
  quantity: number;

  @IsNotEmpty({ message: 'Level không được để trống' })
  level: string;

  @IsNotEmpty({ message: 'Start Date không được để trống' })
  @Transform(({ value }) => new Date(value))
  @IsDate({ message: 'Định dạng Date!' })
  startDate: Date;

  @Transform(({ value }) => new Date(value))
  @IsDate({ message: 'Định dạng Date!' })
  @IsNotEmpty({ message: 'End Date không được để trống' })
  endDate: Date;

  @IsNotEmpty({ message: 'Active? không được để trống' })
  @IsBoolean({ message: 'Định dạng boolean' })
  isActive: boolean;
}
