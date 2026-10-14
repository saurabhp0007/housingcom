import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UserRole, type Paginated, type PaymentResponse } from '@housingcom/contracts';
import { Roles } from '../../../core/http/decorators/index.js';
import { AdminPaymentsQueryDto } from '../dto/payments.dto.js';
import { PaymentsService } from '../services/payments.service.js';

@ApiTags('Admin')
@ApiBearerAuth()
@Roles(UserRole.Admin)
@Controller('admin/payments')
export class AdminPaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Get()
  list(@Query() q: AdminPaymentsQueryDto): Promise<Paginated<PaymentResponse>> {
    return this.payments.list(q.status, q.page, q.limit);
  }
}
