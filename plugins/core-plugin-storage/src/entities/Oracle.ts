import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Oracle extends BaseEntity {
    @PrimaryGeneratedColumn()
    public id: number;

    @Column("varchar")
    public requestId: string;

    @Column("varchar")
    public resultId: string;
}
