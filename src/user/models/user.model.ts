import { Table, Column, Model, DataType } from 'sequelize-typescript';
import { UserRole } from '../../common/enums/database.enums';


@Table({ 
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
})
export class User extends Model<User> {

  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  username: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  })
  email: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  password: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    field: 'first_name',
  })
  firstName: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    field: 'last_name',
  })
  lastName: string;

  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    allowNull: true,
    defaultValue: UserRole.VIEWER
  })
  role?: UserRole | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  })
  isActive: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'last_login_at',
  })
  lastLoginAt: Date;

  @Column({
    type: DataType.DATE,
    field: 'created_at',
  })
  created_at: Date;

  @Column({
    type: DataType.DATE,
    field: 'updated_at',
  })
  updated_at: Date;
}
