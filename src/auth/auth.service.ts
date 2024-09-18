import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/users/users.interface';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { genSaltSync, hashSync } from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  getHashPassword(password: string) {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  }

  async register(registerData: RegisterUserDto) {
    const hashPassword = await this.getHashPassword(registerData.password);

    const isExist = await this.userModel.findOne({ email: registerData.email });

    if (isExist) {
      throw new BadRequestException(`email ${registerData.email} đã tồn tại !`);
    }
    const newUser = await this.userModel.create({
      name: registerData.name,
      email: registerData.email,
      password: hashPassword,
      age: registerData.age,
      gender: registerData.gender,
      address: registerData.address,
      role: 'USER',
    });

    return {
      _id: newUser._id,
      createdAt: newUser.createdAt,
    };
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByUserName(username);
    if (user) {
      const isValid = this.usersService.isValidPassword(
        password,
        user.password,
      );

      if (isValid === true) return user;
    }

    return null;
  }

  async login(user: IUser) {
    const payload = {
      sub: 'token login',
      iss: 'from server',
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
