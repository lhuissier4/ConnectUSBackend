import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { IUserLookup } from '../../application/ports/user-lookup.port';

/**
 * Réalisation du port IUserLookup : récupère le nom d'affichage en interrogeant
 * directement la table user_accounts, sans coupler la feature call au
 * domaine/repository de la feature user.
 */
@Injectable()
export class UserLookupAdapter implements IUserLookup {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findDisplayName(userId: number): Promise<string | null> {
    const rows: Array<{ first_name: string; last_name: string }> =
      await this.dataSource.query(
        'SELECT first_name, last_name FROM user_accounts WHERE id = $1',
        [userId],
      );
    const row = rows[0];
    return row ? `${row.first_name} ${row.last_name}` : null;
  }
}
