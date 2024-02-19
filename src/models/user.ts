import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  BeforeInsert,
  BeforeUpdate,
  AfterLoad,
  OneToMany
} from 'typeorm';
import { IsEmail, Matches, Length, IsOptional } from 'class-validator';
import { getIsInvalidMessage } from '../helpers/validation-messages';
import * as bcrypt from 'bcrypt';
import { Category } from './category';
import ExtendedBaseEntity from './extended-base-entity';
import { Budget } from './budget';
import { Transaction } from './transaction';

@Entity()
@Unique(['email'])
export class User extends ExtendedBaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsEmail(undefined, { message: getIsInvalidMessage('Email') })
  email: string;

  @Column()
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
    message: `${getIsInvalidMessage('Password')}. Use a password with at least 8 symbols, including letters and digits.`
  })
  password: string;

  @Column()
  @Length(1, 50, { message: getIsInvalidMessage('First Name') })
  firstName: string;

  @Column()
  @Length(1, 50, { message: getIsInvalidMessage('Last Name') })
  lastName: string;

  @Column({ default: 'USD' })
  @Length(3, 3, { message: getIsInvalidMessage('Currency') })
  @IsOptional()
  currency: string;

  @OneToMany(() => Category, (category) => category.user)
  categories: Category[];

  @OneToMany(() => Budget, (budget) => budget.user)
  budgets: Budget[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[]

  // This property stores a cached password used to check
  // if the password was changed during an update
  cachedPassword: string;

  @AfterLoad()
  cachePassword() {
    this.cachedPassword = this.password;
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.cachedPassword === this.password) return;
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
  }

  async isPasswordValid(inputPassword: string): Promise<boolean> {
    return await bcrypt.compare(inputPassword, this.password);
  }
}
