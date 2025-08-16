export const uploadcarePublicKey = process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY || 'demopublickey'

if (!process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY) {
  console.warn('Uploadcare public key not set - using demo key')
}
