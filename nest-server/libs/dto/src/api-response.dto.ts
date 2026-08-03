import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApiResponseDto<T = any> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Operation completed successfully' })
  message: string;

  @ApiPropertyOptional()
  data?: T;

  @ApiPropertyOptional({
    example: {
      page: 1,
      limit: 10,
      totalItems: 100,
      totalPages: 10,
      timestamp: '2026-07-27T14:30:00.000Z',
    },
  })
  meta?: Record<string, any>;

  @ApiPropertyOptional()
  error?: any;
}
