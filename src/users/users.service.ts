import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { compareSync, genSaltSync, hashSync } from 'bcryptjs';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
  ) {}

  getHashPassword(password: string) {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  }

  async create(createUserDto: CreateUserDto) {
    const hashPassword = this.getHashPassword(createUserDto.password);
    let user = await this.userModel.create({
      email: createUserDto.email,
      password: hashPassword,
      name: createUserDto.name,
    });
    return user;
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) return 'not found user';

    return this.userModel.findById(id);
  }

  findOneByUserName(username: string) {
    return this.userModel.findOne({ email: username });
  }
  async update(updateUserDto: UpdateUserDto) {
    return await this.userModel.updateOne(
      { _id: updateUserDto.id },
      { ...updateUserDto },
    );
  }

  isValidPassword(password: string, hash: string) {
    return compareSync(password, hash); //true or false
  }

  async remove(id: string) {
    return await this.userModel.softDelete({ _id: id });
  }
}
