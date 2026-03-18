import { Alert, Platform } from 'react-native';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleApiError(error: unknown): string {
  if (error instanceof AppError) {
    if (error.isNetworkError) {
      return 'Network error. Please check your internet connection.';
    }
    return error.message;
  }

  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { status?: number; data?: { message?: string } } }).response;
    if (response) {
      if (response.status === 401) {
        return 'Session expired. Please login again.';
      }
      if (response.status === 403) {
        return 'You do not have permission to perform this action.';
      }
      if (response.status === 404) {
        return 'The requested resource was not found.';
      }
      if (response.status === 500) {
        return 'Server error. Please try again later.';
      }
      return response.data?.message || 'An error occurred.';
    }
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }

  return 'An unexpected error occurred. Please try again.';
}

export function showErrorAlert(error: unknown, onRetry?: () => void): void {
  const message = handleApiError(error);
  
  if (onRetry) {
    Alert.alert('Error', message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Retry', onPress: onRetry },
    ]);
  } else {
    Alert.alert('Error', message);
  }
}

export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : '';
  
  console.error(`[${timestamp}]${context ? ` [${context}]` : ''}:`, errorMessage, stack);
  
  if (Platform.OS !== 'web') {
    console.log(`Error logged at ${timestamp}`);
  }
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  onError?: (error: unknown) => void
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    logError(error);
    if (onError) {
      onError(error);
    } else {
      showErrorAlert(error);
    }
    return null;
  }
}
