import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminAuthController } from './admin-auth.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { PointsModule } from '../points/points.module';
import { User } from '../users/entities/user.entity';
import { PointTransaction } from '../points/entities/point-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, PointTransaction]), PointsModule, AuthModule],
  controllers: [AdminController, AdminAuthController],
  providers: [AdminService],
})
export class AdminModule {}
