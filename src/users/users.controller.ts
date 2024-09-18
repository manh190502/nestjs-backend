import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUser, Public, ResponseMessage } from 'src/decorator/customize';
import { IUser } from './users.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ResponseMessage('Create a new User')
  create(@Body() createUserDto: CreateUserDto, @GetUser() user: IUser) {
    return this.usersService.create(createUserDto, user);
  }
  @Get()
  @ResponseMessage('Fetch user with paginate')
  findAll(
    @Query('page') currentPage: string,
    @Query('limit') limit: string,
    @Query() queryString: string,
  ) {
    return this.usersService.findAll(+currentPage, +limit, queryString);
  }

  @Public()
  @Get(':id')
  @ResponseMessage('Fetch user by id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch()
  @ResponseMessage('Update a User')
  update(@Body() updateUserDto: UpdateUserDto, @GetUser() user: IUser) {
    return this.usersService.update(updateUserDto, user);
  }

  @Delete(':id')
  @ResponseMessage('Delete a User')
  remove(@Param('id') id: string, @GetUser() user: IUser) {
    return this.usersService.remove(id, user);
  }
}
