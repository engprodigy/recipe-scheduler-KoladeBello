import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { IsString, IsDate, IsNotEmpty } from 'class-validator';

@Entity()
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @Column()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @Column()
  @IsDate()
  @IsNotEmpty()
  eventTime!: Date;

  @CreateDateColumn()
  createdAt!: Date;
} 