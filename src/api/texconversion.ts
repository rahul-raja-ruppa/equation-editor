export interface TexConversionRequest {
  tex: string;
  customer: string;
  project: string;
  doi: string;
  mathmode: 'display' | 'inline';
}

export interface TexConversionResponse {
  imageUrl: string;
  // Shape not fully verified — field name may differ on live instance
  // TODO: verify against running kriya2.0 before shipping
  [key: string]: unknown;
}

export async function convertEquation(req: TexConversionRequest): Promise<TexConversionResponse> {
  const response = await fetch('/api/texconversion', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text);
  }

  return response.json() as Promise<TexConversionResponse>;
}
