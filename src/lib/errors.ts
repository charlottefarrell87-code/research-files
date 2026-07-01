/**
 * Map raw Supabase / network error messages to friendly user-facing strings.
 */
export function friendlyError(message: string): string {
  const msg = message.toLowerCase()

  // Auth errors
  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Email or password is incorrect. Please try again.'
  }
  if (msg.includes('email not confirmed')) {
    return 'Please confirm your email address before signing in. Check your inbox for a confirmation link.'
  }
  if (msg.includes('user already registered')) {
    return 'An account with this email already exists.'
  }
  if (msg.includes('password should be at least') || msg.includes('password must be at least')) {
    return 'Password must be at least 8 characters long.'
  }
  if (msg.includes('jwt expired') || msg.includes('session expired')) {
    return 'Your session has expired. Please sign in again.'
  }
  if (msg.includes('token has expired') || msg.includes('refresh token')) {
    return 'Your session has expired. Please sign in again.'
  }

  // Storage errors
  if (msg.includes('invalid key') || msg.includes('invalid storage key')) {
    return 'The file could not be uploaded. Please remove any special characters from the file name and try again.'
  }
  if (msg.includes('exceeded the maximum') || msg.includes('payload too large') || msg.includes('file size')) {
    return 'This file is too large to upload. Please reduce the file size and try again.'
  }
  if (msg.includes('bucket not found')) {
    return 'Storage is not set up correctly. Please contact your admin.'
  }
  if (msg.includes('object not found') || msg.includes('not found')) {
    return 'The file could not be found. It may have already been deleted.'
  }
  if (msg.includes('duplicate') || msg.includes('already exists')) {
    return 'Something with this name already exists. Please use a different name.'
  }

  // Permission errors
  if (
    msg.includes('row-level security') ||
    msg.includes('permission denied') ||
    msg.includes('violates row-level')
  ) {
    return "You don't have permission to do this. Contact your admin if you think this is a mistake."
  }
  if (msg.includes('not authorized') || msg.includes('unauthorized')) {
    return "You're not authorised to perform this action."
  }

  // Network / connectivity
  if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('connection')) {
    return 'Connection error. Please check your internet connection and try again.'
  }
  if (msg.includes('timeout')) {
    return 'The request timed out. Please try again.'
  }

  // Fallback — strip technical jargon but keep the message readable
  return 'Something went wrong. Please try again, or contact your admin if the problem continues.'
}
