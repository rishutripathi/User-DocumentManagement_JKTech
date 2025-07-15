import { Injectable, Logger } from "@nestjs/common";
import { ISeedingService, IUserService } from "../interfaces/seeding.interface";
import * as bcrypt from 'bcrypt';
import { faker } from "@faker-js/faker/.";
import { UserRoleEnum } from "src/user/enum/user.enum";

@Injectable()
export class UserSeedingService implements ISeedingService {
  private readonly logger = new Logger(UserSeedingService.name);

  constructor(private readonly userService: IUserService) {}

  async seed(count: number = 1000) {
    this.logger.log(`Starting to seed ${count} users...`);
    const startTime = Date.now();
    const batchSize = 100;
    const saltRounds = 10;

    const commonPasswords = ['password_rishu@123', 'admin_rishu@123', 'user_rishu@123', 'editor_rishu@123'];
    const hashedPasswords = await Promise.all(commonPasswords.map(pwd => bcrypt.hash(pwd, saltRounds)));
    const roleWeights = [0.05, 0.25, 0.70]; // 5% admin, 25% editor, 70% viewer

    let totalCreated = 0;
    const batches = Math.ceil(count / batchSize);

    for (let batch = 0; batch < batches; batch++) {
      const currentBatchSize = Math.min(batchSize, count - totalCreated);
      const usersToCreate: any[] = [];

      for (let i = 0; i < currentBatchSize; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const username = faker.internet.userName({ firstName, lastName }).toLowerCase();
        const email = faker.internet.email({ firstName, lastName }).toLowerCase();
        const random = Math.random();
        let role = UserRoleEnum.VIEWER;
        if (random < roleWeights[0]) role = UserRoleEnum.ADMIN;
        else if (random < roleWeights[0] + roleWeights[1]) role = UserRoleEnum.EDITOR;

        const passwordIndex = Math.floor(Math.random() * hashedPasswords.length);
        usersToCreate.push({
          username: `${username}_${Date.now()}_${i}`,
          email: `${Date.now()}_${i}_${email}`,
          password: hashedPasswords[passwordIndex],
          firstName,
          lastName,
          role,
          isActive: Math.random() > 0.1,
          lastLoginAt: new Date(),
        });
      }
      await this.userService.bulkCreate(usersToCreate);
      totalCreated += currentBatchSize;
      this.logger.log(`Batch ${batch + 1}/${batches} completed. Created ${totalCreated}/${count} users`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    this.logger.log(`Successfully seeded ${totalCreated} users in ${duration} seconds`);
    return { message: `Successfully seeded ${totalCreated} users`, duration, total: totalCreated };
  }
}