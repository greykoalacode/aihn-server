import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Category } from "./Category";
import { Theme } from "./Theme";
import { StoryType } from "./types/Item";

@Entity()
export class Gist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  itemId: number;

  @ManyToMany(() => Category, (category) => category.items)
  @JoinTable({
    name: "item_category", // Join table name
    joinColumn: { name: "itemId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "categoryId", referencedColumnName: "id" },
  })
  categories?: Category[];

  @ManyToMany(() => Theme, (theme) => theme.items)
  @JoinTable({
    name: "item_theme", // Join table name
    joinColumn: { name: "itemId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "themeId", referencedColumnName: "id" },
  })
  themes?: Theme[];

  @Column()
  type: StoryType;

  @Column()
  summary?: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  url: string;

  @Column()
  storyURL?: string = "";

  @Column()
  by?: string;

  @Column()
  score?: number;

  @Column()
  descendants?: number;

  @Column()
  time: number;

  @CreateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  public created_at: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
    onUpdate: "CURRENT_TIMESTAMP(6)",
  })
  public updated_at: Date;
}
