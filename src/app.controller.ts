import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

class Test {
  @ApiProperty({
    required: true,
    type: String,
    description: 'Nama',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/test')
  getTest(@Body() body: Test): Test {
    return body;
  }
}
