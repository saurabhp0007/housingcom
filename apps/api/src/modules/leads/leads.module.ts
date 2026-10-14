import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from '../chat/chat.module.js';
import { ListingsModule } from '../listings/listings.module.js';
import { RecommendationsModule } from '../recommendations/recommendations.module.js';
import { UsersModule } from '../users/users.module.js';
import { ListingContactController } from './controllers/listing-contact.controller.js';
import { MyVisitsController } from './controllers/my-visits.controller.js';
import { Lead } from './entities/lead.entity.js';
import { Visit } from './entities/visit.entity.js';
import { LEADS_REPOSITORY } from './interfaces/leads-repository.interface.js';
import { TypeOrmLeadsRepository } from './repositories/leads.repository.js';
import { LeadsService } from './services/leads.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, Visit]),
    ListingsModule,
    UsersModule,
    ChatModule,
    RecommendationsModule,
  ],
  controllers: [ListingContactController, MyVisitsController],
  providers: [LeadsService, { provide: LEADS_REPOSITORY, useClass: TypeOrmLeadsRepository }],
  exports: [LeadsService],
})
export class LeadsModule {}
