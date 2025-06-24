export const Logger = {
  isHTTP: false,
  isDevelopment: process.env.NODE_ENV === 'development',

  log: (...args: any[]) => {
    // Only show INFO logs in development mode or when explicitly enabled
    if (Logger.isDevelopment || process.env.VERBOSE_LOGGING === 'true') {
      if (Logger.isHTTP) {
        console.log("[INFO]", ...args);
      } else {
        console.error("[INFO]", ...args);
      }
    }
  },

  error: (...args: any[]) => {
    // Always show errors, but filter out known non-critical ones
    const message = args.join(' ');

    // Filter out EventSource errors in production - they're expected
    if (!Logger.isDevelopment && message.includes('EventSource')) {
      return;
    }

    // Filter out Figma Dev Mode connection errors in production - they're expected
    if (!Logger.isDevelopment && message.includes('Figma Dev Mode MCP Server not available')) {
      return;
    }

    console.error("[ERROR]", ...args);
  },

  // Always log important messages regardless of environment
  important: (...args: any[]) => {
    if (Logger.isHTTP) {
      console.log("[INFO]", ...args);
    } else {
      console.error("[INFO]", ...args);
    }
  },
};
