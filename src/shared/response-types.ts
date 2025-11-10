export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta?: Record<string, any>;
};

export type ApiError = {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: any;
  };
};
