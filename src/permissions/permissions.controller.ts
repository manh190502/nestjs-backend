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
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { GetUser, ResponseMessage } from 'src/decorator/customize';
import { IUser } from 'src/users/users.interface';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ResponseMessage('Create new permission')
  create(
    @Body() createPermissionDto: CreatePermissionDto,
    @GetUser() user: IUser,
  ) {
    return this.permissionsService.create(createPermissionDto, user);
  }

  @Get()
  @ResponseMessage('fetch permission with paginate')
  findAll(
    @Query('current') currentPage: string,
    @Query('pageSize') limit: string,
    @Query() queryString: string,
  ) {
    return this.permissionsService.findAll(+currentPage, +limit, queryString);
  }

  @Get(':id')
  @ResponseMessage('fetch permission with id')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage('Update permission')
  update(
    @Param('id') id: string,
    @Body() updatePermissionDto: UpdatePermissionDto,
    @GetUser() user: IUser,
  ) {
    return this.permissionsService.update(id, updatePermissionDto, user);
  }

  @Delete(':id')
  @ResponseMessage('Delete permission')
  remove(@Param('id') id: string, @GetUser() user: IUser) {
    return this.permissionsService.remove(id, user);
  }
}
