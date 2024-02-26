export const getCurioID = (url: string) => {
  const currentFileUrl = url
  const filePath = new URL(currentFileUrl).pathname
  const fileName = filePath.substring(filePath.lastIndexOf('/') + 1)
  const id = fileName.replace(/\.[^/.]+$/, '')
  return id
}
