export class LocalStorageService {
  static async setItem(key: string, value: any) {
    await localStorage.setItem(key, JSON.stringify(value))
  }

  static async getItem(key: string) {
    const value = await localStorage.getItem(key)
    return value
  }

  static async removeItem(key: string) {
    await localStorage.removeItem(key)
  }
}
