import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { NotifyService } from './notify/notify.service';

async function bootstrap() {
  const logger = new Logger('Main');
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: ['error', 'debug', 'log', 'error', 'warn'],
  });

  // ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    }),
  );

  // CORS
  const options: CorsOptions = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  };
  app.enableCors(options);

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Streamfund Backend')
    .setDescription('Streamfund API Documentation')
    .setVersion('0.1.0')
    .addTag('streamfund')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Helmet
  app.use(helmet());

  // Watch for contract events
  const notifyService = app.get(NotifyService);
  notifyService.watchContract();

  const PORT = process.env.PORT || 5111;

  await app.listen(PORT, () => {
    logger.log(`Server running on http://localhost:${PORT}`);
  });
}
bootstrap();
