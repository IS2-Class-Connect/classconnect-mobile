// Base URL for the Gateway
const GATEWAY_URL = process.env.EXPO_PUBLIC_GATEWAY_URL || 'http://localhost:3000';

async function handleError(res: Response, method: string, endpoint: string) {
  let errorBody: any;
  let isJson = res.headers.get('content-type')?.includes('application/json');

  try {
    errorBody = isJson ? await res.json() : await res.text();
  } catch {
    errorBody = await res.text();
  }

  console.log(`🚨 ${method} request to ${endpoint} failed`);
  console.log(`Status: ${res.status} ${res.statusText}`);
  console.log('Response:', errorBody);

  const message = typeof errorBody === 'object'
    ? errorBody.message || JSON.stringify(errorBody)
    : errorBody;

  throw new Error(`Error ${res.status}: ${message}`);
}


export async function getFromGateway(endpoint: string, token?: string) {
  const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) await handleError(res, 'GET', endpoint);
  return res.json();
}

export async function postToGateway(endpoint: string, data: any, token?: string) {
  const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) await handleError(res, 'POST', endpoint);
  return res.json();
}

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
    let errorText;
    try {
      const json = await res.json();
      errorText = json?.message || JSON.stringify(json);
    } catch (e) {
      errorText = await res.text();
    }

    console.log(`🚨 PATCH request to ${endpoint} failed`);
    console.log(`Status: ${res.status} ${res.statusText}`);
    console.log('Response:', errorText);

    throw new Error(`Error ${res.status}: ${errorText}`);
  }

  return res.json();
}


export async function deleteFromGateway(endpoint: string, token?: string) {
  const res = await fetch(`${GATEWAY_URL}${endpoint}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) await handleError(res, 'DELETE', endpoint);
}
