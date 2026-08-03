import { ApiResponseInterface } from '../interfaces';

export class ResponseHelper {
  static success<T>(
    data: T,
    message = 'Success',
    statusCode = 200,
    meta?: any,
  ): ApiResponseInterface<T> {
    return {
      success: true,
      statusCode,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        ...meta,
      },
    };
  }

  static error(
    message = 'Internal Server Error',
    statusCode = 500,
    errorDetails?: any,
    correlationId?: string,
  ): ApiResponseInterface {
    return {
      success: false,
      statusCode,
      message,
      error: errorDetails,
      meta: {
        timestamp: new Date().toISOString(),
        correlationId,
      },
    };
  }
}
