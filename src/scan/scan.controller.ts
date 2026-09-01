import { Body, Controller, Post } from '@nestjs/common';
import { ScanService } from './scan.service';
import { RecognizeCardDto } from './dto/recognize-card.dto';

@Controller('scan')
export class ScanController {
  constructor(private readonly scanService: ScanService) {}

  @Post('card')
  recognizeCard(@Body() dto: RecognizeCardDto) {
    return this.scanService.recognizeCard(dto);
  }
}
