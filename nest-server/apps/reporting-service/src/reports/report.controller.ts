import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportService } from './report.service';
import { JwtAuthGuard, RolesGuard, PermissionsGuard, Permissions, CurrentUser } from '@app/auth';
import {
  CreateReportDto,
  ExportReportDto,
  ScheduleReportDto,
  ReportQueryDto,
  UuidParamDto,
} from '@app/dto';
import { PermissionEnum } from '@app/common';

@ApiTags('Enterprise Reporting & Multi-Format Exporter')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post()
  @Permissions(PermissionEnum.REPORTS_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a new enterprise report' })
  @ApiResponse({ status: 201, description: 'Report generation started' })
  async create(@Body() dto: CreateReportDto, @CurrentUser('id') userId: string) {
    return this.reportService.createReport(dto, userId);
  }

  @Post('export')
  @Permissions(PermissionEnum.REPORTS_EXPORT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Instantly export report in PDF, Excel (.xlsx), CSV, or JSON format' })
  @ApiResponse({ status: 200, description: 'File stream returned' })
  async exportInstant(@Body() dto: ExportReportDto, @Res() res: Response) {
    const exportResult = await this.reportService.exportReportInstant(dto);

    res.setHeader('Content-Type', exportResult.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    return res.send(exportResult.buffer);
  }

  @Post('schedule')
  @Permissions(PermissionEnum.REPORTS_MANAGE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create automated recurring report schedule via Cron expression' })
  @ApiResponse({ status: 201, description: 'Report schedule created' })
  async schedule(@Body() dto: ScheduleReportDto, @CurrentUser('id') userId: string) {
    return this.reportService.scheduleReport(dto, userId);
  }

  @Get()
  @Permissions(PermissionEnum.REPORTS_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get paginated list of generated reports' })
  @ApiResponse({ status: 200, description: 'Reports list returned' })
  async findAll(@Query() query: ReportQueryDto) {
    return this.reportService.findAllReports(query);
  }

  @Get(':id')
  @Permissions(PermissionEnum.REPORTS_READ)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get report details by ID' })
  @ApiResponse({ status: 200, description: 'Report details returned' })
  async findOne(@Param() param: UuidParamDto) {
    return this.reportService.findReportById(param.id);
  }

  @Delete(':id')
  @Permissions(PermissionEnum.REPORTS_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a report file record' })
  @ApiResponse({ status: 200, description: 'Report deleted' })
  async delete(@Param() param: UuidParamDto) {
    return this.reportService.deleteReport(param.id);
  }
}
