const EXTENSION_ID = process.env.NEXT_PUBLIC_EXTENSION_ID ?? '';

// chrome.runtime не типізований поза extension-контекстом — приводимо через unknown
type ChromeRuntime = {
  sendMessage: (
    id: string,
    message: unknown,
    callback: (response: unknown) => void
  ) => void;
  lastError?: { message: string };
};
type ChromeGlobal = { runtime: ChromeRuntime };

function getChromeRuntime(): ChromeGlobal | null {
  if (typeof window === 'undefined') return null;
  const cr = (window as unknown as { chrome?: ChromeGlobal }).chrome;
  return cr?.runtime ? cr : null;
}

export async function syncWithExtension(
  token: string,
  userId: string,
  email: string
): Promise<'ok' | 'no_id' | 'not_found'> {
  if (!EXTENSION_ID) return 'no_id';

  const cr = getChromeRuntime();
  if (!cr) return 'not_found';

  return new Promise((resolve) => {
    cr.runtime.sendMessage(
      EXTENSION_ID,
      { type: 'SET_AUTH', token, userId, email },
      (_response) => {
        if (cr.runtime.lastError) {
          console.log('[LF] Extension not found:', cr.runtime.lastError.message);
          resolve('not_found');
        } else {
          console.log('[LF] Extension synced');
          resolve('ok');
        }
      }
    );
  });
}
