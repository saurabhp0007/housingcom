import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { UserResponse } from '@housingcom/contracts';
import type { AuthUser } from '../../../core/auth/auth-user.js';
import { CurrentUser } from '../../../core/http/decorators/index.js';
import { BecomeListerDto } from '../dto/become-lister.dto.js';
import { RegisterDeviceDto } from '../dto/register-device.dto.js';
import { UpdateProfileDto } from '../dto/update-profile.dto.js';
import { UsersService } from '../services/users.service.js';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: AuthUser): Promise<UserResponse> {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto): Promise<UserResponse> {
    return this.usersService.updateProfile(user.id, dto);
  }

  /** Switch to lister mode (owner, dealer or PG operator). */
  @Post('me/lister')
  becomeLister(@CurrentUser() user: AuthUser, @Body() dto: BecomeListerDto): Promise<UserResponse> {
    return this.usersService.becomeLister(user.id, dto.listerType, dto.businessName);
  }

  /** Registers or refreshes this device's push token. */
  @Put('me/devices')
  @HttpCode(HttpStatus.NO_CONTENT)
  registerDevice(@CurrentUser() user: AuthUser, @Body() dto: RegisterDeviceDto): Promise<void> {
    return this.usersService.registerDevice({
      userId: user.id,
      deviceId: dto.id,
      platform: dto.platform,
      pushToken: dto.pushToken,
    });
  }
}
