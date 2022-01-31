export function getImageData(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("context could not be created");
  }
  context.drawImage(image, 0, 0);

  return context.getImageData(0, 0, image.width, image.height);
}

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}
export function getPixel(imagedata: ImageData, x: number, y: number): RGBA {
  const position = (x + imagedata.width * y) * 4;
  const data = imagedata.data;
  return {
    r: data[position],
    g: data[position + 1],
    b: data[position + 2],
    a: data[position + 3],
  };
}
