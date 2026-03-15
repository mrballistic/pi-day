// Allow importing plain CSS files (used by Next.js App Router)
declare module '*.css' {
  const content: Record<string, string>
  export default content
}
