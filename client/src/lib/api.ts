const API_BASE_URL = 'http://localhost:5158';

export const getApiUrl = (path: string) => `${API_BASE_URL}${path}`;

export const apiRequest = async (path: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(getApiUrl(path), {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  // Handle empty responses or HTTP 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
};
