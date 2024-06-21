import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Gist } from './Gist';

@Entity()
export class Theme {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // Many-to-Many relationship with Item
  @ManyToMany(() => Gist, (item) => item.themes)
  items: Gist[];
}