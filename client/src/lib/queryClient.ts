import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { AdminAuth } from "./admin-auth";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Check if we're in Firebase hosting environment (no backend)
const isFirebaseHosting = !window.location.hostname.includes('replit');

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // If in Firebase hosting, use ImageKit backend service
  if (isFirebaseHosting) {
    const { imagekitBackend } = await import('./imagekit-backend');
    
    // Route API calls to ImageKit backend service
    if (url.includes('/api/algorithms')) {
      if (method === 'GET') {
        const algorithms = await imagekitBackend.getAlgorithms();
        return new Response(JSON.stringify(algorithms), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (method === 'POST') {
        const algorithm = await imagekitBackend.createAlgorithm(data as any);
        return new Response(JSON.stringify(algorithm), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (method === 'DELETE') {
        const id = url.split('/').pop();
        if (id) await imagekitBackend.deleteAlgorithm(id);
        return new Response('', { status: 204 });
      }
    } else if (url.includes('/api/projects')) {
      if (method === 'GET') {
        const projects = await imagekitBackend.getProjects();
        return new Response(JSON.stringify(projects), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (method === 'POST') {
        const project = await imagekitBackend.createProject(data as any);
        return new Response(JSON.stringify(project), {
          status: 201,
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (method === 'DELETE') {
        const id = url.split('/').pop();
        if (id) await imagekitBackend.deleteProject(id);
        return new Response('', { status: 204 });
      }
    } else if (url.includes('/api/auth/admin/login')) {
      const result = await imagekitBackend.adminLogin((data as any).email, (data as any).password);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 401,
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (url.includes('/api/files')) {
      if (method === 'GET') {
        const files = await imagekitBackend.getFiles();
        return new Response(JSON.stringify(files), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Fallback for unhandled routes
    return new Response(JSON.stringify({ error: 'Route not implemented' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Original implementation for Replit environment
  let headers: Record<string, string> = {};
  let body: string | FormData | undefined;

  // Add auth headers
  const authHeaders = AdminAuth.getInstance().getAuthHeaders();
  headers = { ...headers, ...authHeaders };

  if (data instanceof FormData) {
    body = data;
    // Don't set Content-Type for FormData, let browser set it with boundary
  } else if (data) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(data);
  }

  const res = await fetch(url, {
    method,
    headers,
    body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const queryUrl = queryKey.join("/") as string;
    
    // If in Firebase hosting, use ImageKit backend service
    if (isFirebaseHosting) {
      const { imagekitBackend } = await import('./imagekit-backend');
      
      if (queryUrl.includes('/api/algorithms')) {
        return await imagekitBackend.getAlgorithms();
      } else if (queryUrl.includes('/api/projects')) {
        return await imagekitBackend.getProjects();
      } else if (queryUrl.includes('/api/files')) {
        return await imagekitBackend.getFiles();
      }
      
      return null;
    }

    // Original implementation for Replit environment
    const authHeaders = AdminAuth.getInstance().getAuthHeaders();
    
    const res = await fetch(queryUrl, {
      credentials: "include",
      headers: authHeaders,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes stale time for better performance
      gcTime: 30 * 60 * 1000, // 30 minutes cache time
      retry: 2, // Allow limited retries for network issues
      retryDelay: attemptIndex => Math.min(500 * 2 ** attemptIndex, 2000), // Faster retry delays
    },
    mutations: {
      retry: 1, // Allow one retry for mutations
    },
  },
});
