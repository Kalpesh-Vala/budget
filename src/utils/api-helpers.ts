/**
 * Handle API error responses
 */
export function handleApiError(error: unknown): {
  message: string;
  status: number;
} {
  if (error instanceof Error) {
    return {
      message: error.message,
      status: 400,
    };
  }

  return {
    message: 'An unknown error occurred',
    status: 500,
  };
}

/**
 * Create success API response
 */
export function successResponse(data: unknown, statusCode = 200) {
  return {
    status: statusCode,
    data,
  };
}

/**
 * Create error API response
 */
export function errorResponse(message: string, statusCode = 400) {
  return {
    status: statusCode,
    error: message,
  };
}
