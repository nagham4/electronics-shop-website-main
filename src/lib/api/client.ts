// HTTP client for the future ASP.NET Core Web API.
// When VITE_API_BASE_URL is not set, the store runs on local sample data
// and order submission is disabled (no fake success).
export const API_BASE_URL: string | undefined = import.meta.env['VITE_API_BASE_URL'] || undefined;
export const isBackendConnected = Boolean(API_BASE_URL);

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) throw new ApiError("المتجر غير متصل بالخادم حالياً.");
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
  } catch {
    throw new ApiError("تعذّر الاتصال بالخادم، يرجى المحاولة لاحقاً.");
  }
  if (!res.ok) {
    let msg = "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.";
    try {
      const body = await res.json();
      if (body?.message) msg = body.message;
    } catch {
      /* ignore */
    }
    throw new ApiError(msg, res.status);
  }
  return res.json() as Promise<T>;
}

export const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));
