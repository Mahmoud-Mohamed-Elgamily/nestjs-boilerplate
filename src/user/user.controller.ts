import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from 'shared/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Returns the current user profile',
    schema: {
      example: {
        success: true,
        data: {
          id: '1',
          email: 'user@example.com',
          name: 'John Doe',
          role: 'user',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  getProfile(@Request() req) {
    return req.user;
  }

  @Public()
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Public()
  @Get()
  findAll(@Query() paginationDto: PaginationDto, @Query() queryDto?: UpdateUserDto) {
    return this.userService.findAll(paginationDto, { where: queryDto as any });
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne({ where: { id }, relations: [] });
  }

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update({ id }, updateUserDto);
  }

  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  remove(@Param('id') id: string) {
    return this.userService.remove({ id });
  }
}
