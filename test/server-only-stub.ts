// Stands in for the `server-only` package under Vitest. The real module exists
// to fail the build if server code is imported into a client bundle; in a test
// runner there is no such boundary to protect.
export {};
