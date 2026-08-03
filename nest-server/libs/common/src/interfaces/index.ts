export interface ApiResponseInterface<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    totalItems?: number;
    totalPages?: number;
    timestamp: string;
    correlationId?: string;
  };
  error?: any;
}

export interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    roles: string[];
  };
  correlationId?: string;
}
