import { Test, TestingModule } from '@nestjs/testing';
import { FootprintService } from './footprint.service';

describe('FootprintService', () => {
  let service: FootprintService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FootprintService],
    }).compile();

    service = module.get<FootprintService>(FootprintService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
