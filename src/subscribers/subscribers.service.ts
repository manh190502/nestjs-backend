import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';
import { UpdateSubscriberDto } from './dto/update-subscriber.dto';
import { IUser } from 'src/users/users.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Subscriber, SubscriberDocument } from './schemas/subscriber.schema';
import { SoftDeleteModel } from 'soft-delete-plugin-mongoose';
import aqp from 'api-query-params';

@Injectable()
export class SubscribersService {
  constructor(
    @InjectModel(Subscriber.name)
    private subscriberModel: SoftDeleteModel<SubscriberDocument>,
  ) {}
  async create(createSubscriberDto: CreateSubscriberDto, user: IUser) {
    const isExist = await this.subscriberModel.findOne({
      email: createSubscriberDto.email,
    });

    if (isExist)
      throw new BadRequestException(
        `Email ${createSubscriberDto.email} is existed!`,
      );

    let newSubs = await this.subscriberModel.create({
      ...createSubscriberDto,
      createdBy: {
        _id: user._id,
        email: user.email,
      },
    });

    return {
      _id: newSubs?._id,
      createdAt: newSubs.createdAt,
    };
  }

  async findAll(currentPage: number, limit: number, queryString: string) {
    const { filter, sort, population, projection } = aqp(queryString);
    delete filter.current;
    delete filter.pageSize;

    let offset = (currentPage - 1) * limit;
    let defaultLimit = limit ? limit : 10;

    const totalItems = (await this.subscriberModel.find(filter)).length;
    const totalPages = Math.ceil(totalItems / defaultLimit);

    const result = await this.subscriberModel
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
    return await this.subscriberModel.findOne({ _id: id });
  }

  async update(updateSubscriberDto: UpdateSubscriberDto, user: IUser) {
    return await this.subscriberModel.updateOne(
      { email: user.email },
      {
        ...updateSubscriberDto,
        updatedBy: { _id: user._id, email: user.email },
      },
      { upsert: true },
    );
  }

  async remove(id: string, user: IUser) {
    await this.subscriberModel.updateOne(
      { _id: id },
      {
        deletedBy: {
          _id: user._id,
          email: user.email,
        },
      },
    );

    return await this.subscriberModel.softDelete({ _id: id });
  }

  async getSkills(user: IUser) {
    const { email } = user;
    return await this.subscriberModel.findOne({ email }, { skills: 1 });
  }
}
