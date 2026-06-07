import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { IUserLookup } from '../../application/ports/user-lookup.port';

/**
 * Réalisation du port IUserLookup : vérifie l'existence d'un utilisateur en
 * interrogeant directement la table user_accounts, sans coupler la feature
 * message au domaine/repository de la feature user.
 */
@Injectable()
export class UserLookupAdapter implements IUserLookup {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async exists(userId: number): Promise<boolean> {
    const rows: Array<{ exists: boolean }> = await this.dataSource.query(
      'SELECT EXISTS(SELECT 1 FROM user_accounts WHERE id = $1) AS exists',
      [userId],
    );
    return rows[0]?.exists === true;
  }

  async getNames(ids: number[]): Promise<Map<number, string>> {
    const names = new Map<number, string>();
    if (ids.length === 0) return names;

    const rows: Array<{ id: number; first_name: string; last_name: string }> =
      await this.dataSource.query(
        'SELECT id, first_name, last_name FROM user_accounts WHERE id = ANY($1)',
        [ids],
      );

    for (const row of rows) {
      names.set(Number(row.id), `${row.first_name} ${row.last_name}`);
    }
    return names;
  }
}
