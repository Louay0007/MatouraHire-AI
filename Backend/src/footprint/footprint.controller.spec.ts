import { Test, TestingModule } from '@nestjs/testing';
import { FootprintController } from './footprint.controller';

describe('FootprintController', () => {
  let controller: FootprintController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FootprintController],
    }).compile();

    controller = module.get<FootprintController>(FootprintController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
