import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { IsString, IsNotEmpty } from 'class-validator';

@Entity()
export class Device {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsString()
  @IsNotEmpty()
  userId: string;

  @Column()
  @IsString()
  @IsNotEmpty()
  pushToken: string;

  @CreateDateColumn()
  createdAt: Date;
} 