const API_BASE = '/api';

interface ApiOptions {
  method?: string;
  body?: unknown;
  token?: string | null;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function api<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    if (data.errors && Array.isArray(data.errors)) {
      const errorMsg = data.errors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
      throw new Error(errorMsg || data.message || 'Validation Error');
    }
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }

  return data;
}
