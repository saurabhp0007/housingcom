import { Module } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentDriver } from '@housingcom/contracts';
import { paymentsConfig } from '../../config/configuration.js';
import { UsersModule } from '../users/users.module.js';
import { AdminPaymentsController } from './controllers/admin-payments.controller.js';
import { PaymentsController } from './controllers/payments.controller.js';
import { Payment } from './entities/payment.entity.js';
import { FakeGateway } from './gateways/fake.gateway.js';
import { RazorpayGateway } from './gateways/razorpay.gateway.js';
import { PAYMENT_GATEWAY } from './interfaces/payment-gateway.interface.js';
import { PAYMENTS_REPOSITORY } from './interfaces/payments-repository.interface.js';
import { TypeOrmPaymentsRepository } from './repositories/payments.repository.js';
import { PaymentsService } from './services/payments.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), UsersModule],
  controllers: [PaymentsController, AdminPaymentsController],
  providers: [
    PaymentsService,
    RazorpayGateway,
    FakeGateway,
    {
      provide: PAYMENT_GATEWAY,
      inject: [paymentsConfig.KEY, RazorpayGateway, FakeGateway],
      useFactory: (
        config: ConfigType<typeof paymentsConfig>,
        razorpay: RazorpayGateway,
        fake: FakeGateway,
      ) => (config.driver === PaymentDriver.Fake ? fake : razorpay),
    },
    { provide: PAYMENTS_REPOSITORY, useClass: TypeOrmPaymentsRepository },
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
