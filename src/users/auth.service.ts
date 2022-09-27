import { Injectable, BadRequestException } from '@nestjs/common';
import { randomBytes, scrypt as _scrypt } from 'crypto';
import { UsersService } from './users.service';
import { promisify } from 'util';

const scrypt = promisify(_scrypt);

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async signup(email: string, password: string) {
    // See if email is in use
    const users = await this.usersService.find(email);
    if (users.length) {
      // If email is in use, throw an error
      throw new BadRequestException('email in use');
    }

    // Hash the user password
    // Generate the salt
    const salt = randomBytes(8).toString('hex');

    // Hash the password + salt
    const hash = (await scrypt(password, salt, 32)) as Buffer;

    // Join password and salt together
    const result = salt + '.' + hash.toString('hex');

    // Create a new user and save it to the database
    const user = await this.usersService.create(email, result);

    // return the user
    return user;

  }

  async signin(email: string, password: string) {
    const [user] = await this.usersService.find(email);

    const [salt, storedHash] = user.password.split('.');

    const hash = (await scrypt(password, salt, 32)) as Buffer;

    if (storedHash !== hash.toString('hex')) {
      throw new BadRequestException('bad password');
    }

    return user;
  }
}
