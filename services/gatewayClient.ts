// services/gatewayClient.ts

// Base URL for the Gateway, configurable via environment variable or defaults to localhost
const GATEWAY_URL = process.env.EXPO_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

/**
 * Helper for sending GET requests to the Gateway.
 * If a Firebase token is provided, it's included in the Authorization header.
 */
export async function getFromGateway(endpoint: string, token?: string) {
  const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const error = await res.text();
    console.log('🚨 GET request error:', error);
    throw new Error(`Error ${res.status}: ${error}`);
  }

  return res.json();
}

/**
 * Helper for sending POST requests to the Gateway.
 * Requires data and optionally a Firebase token.
 */
export async function postToGateway(endpoint: string, data: any, token?: string) {
  const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.text();
    console.log('🚨 POST request error:', error);
    throw new Error(`Error ${res.status}: ${error}`);
  }

  return res.json();
}

/**
 * Helper for sending PATCH requests to the Gateway.
 * Requires data and optionally a Firebase token.
 */
export async function patchToGateway(endpoint: string, data: any, token?: string) {
  const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.text();
    console.log('🚨 PATCH request error:', error);
    throw new Error(`Error ${res.status}: ${error}`);
  }

  return res.json();
}

/**
 * Helper for sending DELETE requests to the Gateway.
 * Optionally includes a Firebase token.
 */
export async function deleteFromGateway(endpoint: string, token?: string) {
  const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const error = await res.text();
    console.log('🚨 DELETE request error:', error);
    throw new Error(`Error ${res.status}: ${error}`);
  }
}
