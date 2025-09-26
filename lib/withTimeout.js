export async function withTimeout(promise, ms, onTimeout) {
  let timeoutId;
  const timeoutPromise = new Promise((resolve, reject) => {
    timeoutId = setTimeout(() => {
      if (typeof onTimeout === "function") {
        try {
          onTimeout();
        } catch (err) {
          console.error("Timeout handler error", err);
        }
      }
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

