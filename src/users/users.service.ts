import { SigninDto } from './dto/signin.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './../auth/auth.service';
import { User } from 'src/users/models/users.model';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User')
    private readonly usersModel: Model<User>,
    private readonly authService: AuthService,
  ) {}

  async signup(signupDto: SignupDto): Promise<User> {
    const user = new this.usersModel(signupDto);
    return user.save();
  }

  async signin(
    signinDto: SigninDto,
  ): Promise<{ name: string; jwtToken: string; email: string }> {
    const user = await this.findByEmail(signinDto.email);
    await this.checkPassword(signinDto.password, user);
    const jwtToken = await this.authService.createAccessToken(user._id);
    return { name: user.name, jwtToken, email: user.email };
  }

  async findAll(): Promise<User[]> {
    return this.usersModel.find();
  }

  private async findByEmail(email: string) {
    const user = await this.usersModel.findOne({ email });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  private async checkPassword(password: string, user: User) {
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      throw new BadRequestException('Invalid credentials');
    }
    return match;
  }
}
