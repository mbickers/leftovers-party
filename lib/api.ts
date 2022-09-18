export type ApiResponse<T> = { data: T; } | { errors: { message: String; }[]; };
export function errorBody(message: string) {
  return { errors: [{message}]}
}