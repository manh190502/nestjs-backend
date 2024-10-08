import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { IUser } from 'src/users/users.interface';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from 'src/users/schemas/user.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { genSaltSync, hashSync } from 'bcryptjs';
import { ConfigService } from '@nestjs/config';
import ms from 'ms';
import { Response } from 'express';
import { Role, RoleDocument } from 'src/roles/schemas/role.schema';
import { USER_ROLE } from 'src/databases/sample';
import { RolesService } from 'src/roles/roles.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: SoftDeleteModel<UserDocument>,
    @InjectModel(Role.name) private roleModel: SoftDeleteModel<RoleDocument>,
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private rolesService: RolesService,
  ) {}

  getHashPassword(password: string) {
    const salt = genSaltSync(10);
    const hash = hashSync(password, salt);
    return hash;
  }

  async register(registerData: RegisterUserDto) {
    const isExist = await this.userModel.findOne({ email: registerData.email });

    if (isExist) {
      throw new BadRequestException(`email ${registerData.email} đã tồn tại !`);
    }

    //fetch user role
    const userRole = await this.roleModel.findOne({ name: USER_ROLE });

    const hashPassword = await this.getHashPassword(registerData.password);

    const newUser = await this.userModel.create({
      name: registerData.name,
      email: registerData.email,
      password: hashPassword,
      age: registerData.age,
      gender: registerData.gender,
      address: registerData.address,
      role: userRole?._id,
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

      if (isValid === true) {
        const userRole = user.role as unknown as { _id: string; name: string };
        const temp = await this.rolesService.findOne(userRole._id);

        const objUser = {
          ...user.toObject(),
          permissions: temp?.permissions ?? [],
        };

        return objUser;
      }
    }

    return null;
  }

  async login(user: IUser, res: Response) {
    const payload = {
      sub: 'token login',
      iss: 'from server',
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const refresh_token = this.createRefreshToken(payload);

    //update user with refresh token
    await this.usersService.updateUserToken(refresh_token, user._id);

    //set refresh_token as cookies
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')),
    });

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      },
    };
  }

  createRefreshToken = (payload) => {
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn:
        ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')) / 1000,
    });

    return refresh_token;
  };

  processNewToken = async (refreshToken: string, res: Response) => {
    try {
      this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      });

      let user = await this.usersService.findUserByToken(refreshToken);

      if (user) {
        //update refresh_token
        const { _id, name, email, role } = user;
        const payload = {
          sub: 'refresh token',
          iss: 'from server',
          _id,
          name,
          email,
          role,
        };

        const refresh_token = this.createRefreshToken(payload);

        await this.usersService.updateUserToken(refresh_token, _id.toString());

        // fetch user role
        const userRole = user.role as unknown as { _id: string; name: string };
        const temp = await this.rolesService.findOne(userRole._id);

        res.clearCookie('refresh_token');

        res.cookie('refresh_token', refresh_token, {
          httpOnly: true,
          maxAge: ms(this.configService.get<string>('JWT_REFRESH_EXPIRE')),
        });

        return {
          access_token: this.jwtService.sign(payload),
          user: {
            _id,
            name,
            email,
            role,
            permissions: temp?.permissions ?? [],
          },
        };
      } else {
        throw new BadRequestException(
          'Refresh token không hợp lệ. Vui lòng đăng nhập lại!',
        );
      }
    } catch (error) {
      throw new BadRequestException(
        'Refresh token không hợp lệ. Vui lòng đăng nhập lại!',
      );
    }
  };

  logout = async (user: IUser, res) => {
    await this.usersService.updateUserToken('', user._id);

    res.clearCookie('refresh_token');

    return 'ok';
  };
}
