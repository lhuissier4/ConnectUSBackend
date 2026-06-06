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
}
