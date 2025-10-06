// API configuration and base client for connecting to backend
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // include credentials by default so cookie auth works cross-origin
      credentials: 'include',
      ...options,
    };

    console.log(`🔄 API Request: ${options.method || 'GET'} ${url}`);
    
    try {
      const response = await fetch(url, config);
      
      console.log(`📡 API Response: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData: any = {};
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        console.error(`❌ API Error Response:`, errorData);
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ API Success:`, data);
      return this.convertDates(data);
    } catch (error) {
      console.error(`💥 API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  private convertDates(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.convertDates(item));
    }

    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string' && (
        key === 'fecha' || 
        key === 'fechaFin' || 
        key === 'fechaCreacion' || 
        key === 'createdAt' || 
        key === 'updatedAt'
      )) {
        // Backend stores date-only as midnight UTC (e.g. 2025-10-04T00:00:00.000Z).
        // If we directly new Date(value) and then format in local timezone, it can show the previous day
        // for negative offsets. To keep the calendar date consistent with backend date-only values,
        // convert the UTC date to a local-midnight Date object with the same Y/M/D.
        const utc = new Date(value);
        converted[key] = new Date(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
      } else if (typeof value === 'object' && value !== null) {
        converted[key] = this.convertDates(value);
      } else {
        converted[key] = value;
      }
    }
    return converted;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);