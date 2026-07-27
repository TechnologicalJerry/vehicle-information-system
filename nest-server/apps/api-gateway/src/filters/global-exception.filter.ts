import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseHelper } from '@app/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const correlationId =
      (request.headers['x-correlation-id'] as string) || (request as any).correlationId;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let errorDetails: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        message = (exceptionResponse as any).message || exception.message;
        errorDetails = (exceptionResponse as any).error || exceptionResponse;
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
    }

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Error: ${JSON.stringify(
        errorDetails || message,
      )} - CorrelationID: ${correlationId}`,
    );

    const formattedResponse = ResponseHelper.error(
      Array.isArray(message) ? message.join(', ') : message,
      status,
      errorDetails,
      correlationId,
    );

    response.status(status).json(formattedResponse);
  }
}
