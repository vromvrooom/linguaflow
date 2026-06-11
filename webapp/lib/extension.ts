// Auth sync to the browser extension via window.postMessage.
// The extension's content script listens for this message on the page, so it
// works for any user regardless of the extension's ID (no externally_connectable
// or NEXT_PUBLIC_EXTENSION_ID needed).
export function syncWithExtension(token: string, userId: string, email: string) {
  try {
    window.postMessage(
      {
        type: 'LINGUAFLOW_SET_AUTH',
        token,
        userId,
        email,
        source: 'linguaflow-webapp',
      },
      window.location.origin
    );
  } catch (e) {
    console.log('Extension sync failed:', e);
  }
}
