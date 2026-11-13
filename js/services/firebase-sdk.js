/**
 * Firebase SDK Lazy Loader using Dynamic import().
 */

export const FIREBASE_SDK_VERSION = '10.13.0';

let sdkPromise = null;

/**
 * Loads the Firebase modular SDK lazily.
 * Returns a cached Promise resolving to { app, auth, firestore }.
 * If loading fails, the cached promise is cleared and error is rethrown.
 *
 * @returns {Promise<{ app: Object, auth: Object, firestore: Object }>}
 */
export function loadFirebaseSdk() {
  if (sdkPromise) {
    return sdkPromise;
  }

  sdkPromise = (async () => {
    try {
      const [app, auth, firestore] = await Promise.all([
        import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`),
        import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-auth.js`),
        import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore.js`)
      ]);
      return { app, auth, firestore };
    } catch (err) {
      sdkPromise = null;
      throw err;
    }
  })();

  return sdkPromise;
}
