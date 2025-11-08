export type PatientProfile = {
  fullName: string
  dateOfBirth: string
  gender: string
  contactNumber: string
  email: string
  opdId: string
  address: string
  username: string
  // created timestamp for display/use
  createdAt?: string
}

const STORAGE_KEY = 'patient_profile_v1'

export function saveProfile(profile: PatientProfile) {
  try {
    const data = { ...profile, createdAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (e) {
    console.error('Failed to save profile', e)
    return false
  }
}

export function getProfile(): PatientProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PatientProfile
  } catch (e) {
    console.error('Failed to parse profile', e)
    return null
  }
}

export function clearProfile() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (e) {
    console.error('Failed to clear profile', e)
  }
}
