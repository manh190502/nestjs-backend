import {
  Body,
  Controller,
  Get,
  Post,
  Render,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth-guard';
import { Public, ResponseMessage } from 'src/decorator/customize';
import { RegisterUserDto } from 'src/users/dto/create-user.dto';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  handleLogin(@Request() req) {
    return this.authService.login(req.user);
  }

  // @UseGuards(JwtAuthGuard)
  @Public()
  @ResponseMessage('Register a new user')
  @Post('/register')
  handleRegister(@Body() registerData: RegisterUserDto) {
    return this.authService.register(registerData);
  }
}
