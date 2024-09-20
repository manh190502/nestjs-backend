import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import { IUser } from 'src/users/users.interface';
import aqp from 'api-query-params';
import mongoose from 'mongoose';

@Injectable()
export class RolesService {
  constructor(
    @InjectModel(Role.name) private roleModel: SoftDeleteModel<RoleDocument>,
  ) {}
  async create(createRoleDto: CreateRoleDto) {
    const { name } = createRoleDto;

    const isExist = await this.roleModel.findOne({ name });
    if (isExist) {
      throw new BadRequestException(`Role ${name} đã tồn tại trong hệ thống !`);
    }

    let newRole = await this.roleModel.create({
      ...createRoleDto,
    });

    return {
      _id: newRole._id,
      createdAt: newRole.createdAt,
    };
  }

  async findAll(currentPage: number, limit: number, queryString: string) {
    const { filter, sort, population, projection } = aqp(queryString);
    delete filter.current;
    delete filter.pageSize;

    let offset = (currentPage - 1) * limit;
    let defaultLimit = limit ? limit : 10;

    const totalItems = (await this.roleModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.roleModel
      .find(filter)
      .skip(offset)
      .limit(defaultLimit)
      .sort(sort as any)
      .populate(population)
      .select(projection as any)
      .exec();

    return {
      meta: {
        current: currentPage,
        pageSize: limit,
        pages: totalPages,
        total: totalItems,
      },
      result,
    };
  }

  async findOne(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('not found role');
    }

    return (await this.roleModel.findById(id)).populate({
      path: 'permissions',
      select: { _id: 1, apiPath: 1, name: 1, method: 1, module: 1 },
    });
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, user: IUser) {
    // const { name } = updateRoleDto;

    // const isExist = await this.roleModel.findOne({ name });
    // if (isExist) {
    //   throw new BadRequestException(`Role ${name} đã tồn tại trong hệ thống !`);
    // }
    return this.roleModel.updateOne(
      { _id: id },
      {
        ...updateRoleDto,
        updatedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );
  }

  async remove(id: string, user: IUser) {
    const admin = await this.roleModel.findById(id);

    if (admin.name === 'ADMIN') {
      throw new BadRequestException('Không thể xóa role ADMIN');
    }

    await this.roleModel.updateOne(
      { _id: id },
      {
        deletedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );

    return await this.roleModel.softDelete({ _id: id });
  }
}
