import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AggregationEngine } from './aggregation.engine';

@Injectable()
export class AnalyticsCronService {
  private readonly logger = new Logger(AnalyticsCronService.name);

  constructor(private readonly aggregationEngine: AggregationEngine) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyAggregation() {
    this.logger.log('Executing Hourly Analytics Aggregation Job');
    await this.aggregationEngine.runScheduledRollup('HOURLY');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyAggregation() {
    this.logger.log('Executing Daily Analytics Aggregation Job');
    await this.aggregationEngine.runScheduledRollup('DAILY');
  }

  @Cron(CronExpression.EVERY_WEEK)
  async handleWeeklyAggregation() {
    this.logger.log('Executing Weekly Analytics Aggregation Job');
    await this.aggregationEngine.runScheduledRollup('WEEKLY');
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async handleMonthlyAggregation() {
    this.logger.log('Executing Monthly Analytics Aggregation Job');
    await this.aggregationEngine.runScheduledRollup('MONTHLY');
  }
}
