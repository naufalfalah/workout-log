const MAX_IMAGE_BYTES = 3 * 1024 * 1024 // 3 MB

export function readImageAsDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    return Promise.reject(new Error('File harus berupa gambar.'))
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return Promise.reject(new Error('Ukuran gambar maksimal 3 MB.'))
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('Gagal membaca file.'))
    reader.readAsDataURL(file)
  })
}
